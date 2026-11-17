import { createOpenAI } from "@ai-sdk/openai";
import { generateText, stepCountIs } from "ai";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { allow, clientIp } from "@/lib/rate-limit";
import { buildConciergeTools, confirmSos } from "@/lib/concierge-tools";
import { nearbyPlaces } from "@/data/nearby-places";
import { travelPackages } from "@/data/packages";

export const runtime = "nodejs";
const messageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) });
const requestSchema = z.object({ userId: z.string().uuid(), locale: z.enum(["en", "ru", "uz"]).default("en"), city: z.string().trim().min(2).max(40).default("Tashkent"), messages: z.array(messageSchema).max(16).optional(), confirmSosToken: z.string().min(20).max(2000).optional() });
const LIMIT = 10;

const text: Record<string, { fallback: string; limit: string; sos: string; sosDenied: string; sosPrompt: string; places: string; packages: string; weather: string; safety: string; price: string; hosts: string; booking: string }> = {
  en: { fallback: "I’m running in demo mode and can use Silkora’s seeded travel guides and listings. Tell me a city and what you need, or try one of the suggestions below.", limit: "You’ve sent several messages quickly. Please wait a minute and try again.", sos: "Demo SOS recorded on this server. No emergency services or contacts were notified.", sosDenied: "That SOS confirmation expired or could not be verified. Please ask for a new confirmation.", sosPrompt: "Review the SOS details and confirm in the dialog if you want to record a demo SOS. No one will be contacted.", places: "Here are matching place listings. Details may be sample data, so confirm important information locally.", packages: "These seeded package ideas can help you plan. Availability and prices need confirmation.", weather: "Here is the current forecast or a clearly labeled sample forecast.", safety: "These are general demo safety reminders, not verified allegations about named people or businesses.", price: "Here is an indicative local range. Actual prices can vary; confirm before buying.", hosts: "Host matching is planned but not available yet.", booking: "To create a pending demo booking request, include the package or place, start and end dates, guest count, and a message. You can also use Request booking on a package page." },
  ru: { fallback: "Я работаю в демо-режиме и использую справочники и места Silkora. Укажите город и запрос или выберите подсказку ниже.", limit: "Вы отправили несколько сообщений подряд. Подождите минуту и попробуйте снова.", sos: "Демо-SOS записан на этом сервере. Экстренные службы и контакты не уведомлялись.", sosDenied: "Подтверждение SOS истекло или не прошло проверку. Запросите новое подтверждение.", sosPrompt: "Проверьте сведения и подтвердите действие в окне, если хотите записать демо-SOS. Никто не будет уведомлён.", places: "Вот подходящие места. Часть сведений может быть примером, поэтому уточняйте важные детали на месте.", packages: "Эти примерные туры помогут с планированием. Уточните наличие и цену.", weather: "Текущий прогноз или явно отмеченный пример прогноза.", safety: "Общие демо-советы, а не подтверждённые обвинения в адрес конкретных людей или компаний.", price: "Примерный местный диапазон цен. Стоимость может отличаться, уточняйте перед покупкой.", hosts: "Подбор хозяев запланирован, но пока недоступен.", booking: "Для демо-запроса на бронирование укажите тур или место, даты начала и окончания, число гостей и сообщение. Также можно нажать «Запросить бронирование» на странице тура." },
  uz: { fallback: "Men demo rejimidaman va Silkora namunaviy ma’lumotlariga tayanaman. Shahar va ehtiyojingizni yozing yoki quyidagi takliflardan birini tanlang.", limit: "Ketma-ket ko‘p xabar yuborildi. Bir daqiqa kutib, qayta urinib ko‘ring.", sos: "Demo SOS serverda qayd etildi. Favqulodda xizmatlar yoki kontaktlarga xabar berilmadi.", sosDenied: "SOS tasdig‘i muddati tugagan yoki tekshiruvdan o‘tmadi. Yangi tasdiq so‘rang.", sosPrompt: "Demo SOSni qayd etishni istasangiz, tafsilotlarni ko‘rib chiqib oynada tasdiqlang. Hech kimga xabar berilmaydi.", places: "Mos joylar ro‘yxati. Ayrim ma’lumotlar namuna, muhim tafsilotlarni joyida aniqlang.", packages: "Bu namunaviy sayohatlar reja tuzishga yordam beradi. Narx va mavjudligini aniqlang.", weather: "Joriy ob-havo yoki demo sifatida belgilangan namuna prognoz.", safety: "Bu umumiy demo tavsiyalari, aniq odam yoki biznes haqidagi tasdiqlangan da’vo emas.", price: "Mahalliy taxminiy narx oralig‘i. Haqiqiy narx o‘zgarishi mumkin, xariddan oldin aniqlang.", hosts: "Mezbon topish rejalashtirilgan, ammo hali mavjud emas.", booking: "Demo bron so‘rovi uchun sayohat yoki joy, boshlanish va tugash sanalari, mehmonlar soni va xabarni yozing. Sayohat sahifasidagi Bron so‘rovi tugmasidan ham foydalanishingiz mumkin." },
};

async function executeOfflineTool(tools: ReturnType<typeof buildConciergeTools>, name: keyof ReturnType<typeof buildConciergeTools>, input: unknown) {
  const executable = tools[name] as unknown as { execute?: (args: unknown, options: { toolCallId: string; messages: never[] }) => Promise<unknown> };
  if (!executable.execute) return { source: "seeded demo data", items: [] };
  return executable.execute(input, { toolCallId: randomUUID(), messages: [] });
}

async function offlineAnswer(message: string, city: string, userId: string, locale: "en" | "ru" | "uz") {
  const tools = buildConciergeTools(userId);
  const query = message.toLowerCase();
  let toolName: keyof typeof tools = "search_places";
  let input: unknown = { city };
  let answer = text[locale].fallback;

  if (/\b(sos|emergency|help me|xavfsizligim|yordam kerak|сос|помогите)\b/i.test(query)) {
    toolName = "trigger_sos"; input = { reason: message.slice(0, 200) };
  } else if (/book|booking|bron|заброн|брониров/i.test(query)) {
    return { answer: text[locale].booking, toolResults: [], mode: "seeded" };
  } else if (/host|mezbon|хозяин/i.test(query)) {
    toolName = "find_hosts"; input = { city };
  } else if (/add.+trip|trip.+add|safarimga|qo.shing|добав.+поезд/i.test(query)) {
    const place = nearbyPlaces.find((item) => item.city.toLowerCase() === city.toLowerCase() && (query.includes(item.name.toLowerCase()) || query.includes(item.name.split(" ")[0].toLowerCase())));
    const pack = travelPackages.find((item) => query.includes(item.title.toLowerCase()) || query.includes(item.title.split(" ")[0].toLowerCase()));
    if (!place && !pack) return { answer: text[locale].fallback, toolResults: [], mode: "seeded" };
    toolName = "add_to_trip";
    input = pack ? { title: pack.title, kind: "package", city: pack.cities[0] ?? city, packageId: pack.id, photo: pack.photo, day: 1 } : { title: place!.name, kind: place!.type, city: place!.city, placeId: place!.id, photo: place!.photo, lat: place!.lat, lng: place!.lng, day: 1 };
  } else if (/weather|forecast|ob-havo|погод/i.test(query)) {
    toolName = "get_weather"; input = { city: city[0].toUpperCase() + city.slice(1).toLowerCase() };
  } else if (/scam|scam|xavfsiz|firib|мошенн|безопас/i.test(query)) {
    toolName = "get_scam_alerts"; input = { city };
  } else if (/price|cost|fair|narx|qancha|цен|стоим/i.test(query)) {
    const match = nearbyPlaces.find((place) => place.city.toLowerCase() === city.toLowerCase() && query.split(/\W+/).some((term) => term.length > 3 && place.name.toLowerCase().includes(term)));
    toolName = "get_fair_price"; input = { item: match?.name ?? "local lunch", city };
  } else if (/package|tour|trip|sayohat|тур|маршрут/i.test(query)) {
    toolName = "search_packages"; input = { city };
  } else {
    const selected = nearbyPlaces.find((place) => place.city.toLowerCase() === city.toLowerCase() && query.split(/\W+/).some((term) => term.length > 3 && place.name.toLowerCase().includes(term)));
    input = { city, type: selected?.type };
  }

  try {
    const output = await executeOfflineTool(tools, toolName, input);
    if (toolName === "trigger_sos") answer = text[locale].sosPrompt;
    else if (toolName === "search_places") answer = text[locale].places;
    else if (toolName === "search_packages") answer = text[locale].packages;
    else if (toolName === "get_weather") answer = text[locale].weather;
    else if (toolName === "get_scam_alerts") answer = text[locale].safety;
    else if (toolName === "get_fair_price") answer = text[locale].price;
    else if (toolName === "find_hosts") answer = text[locale].hosts;
    else if (toolName === "add_to_trip") answer = locale === "ru" ? "Демо-идея добавлена в поездку." : locale === "uz" ? "Demo g‘oya Safarimga qo‘shildi." : "The demo idea was added to My Trip.";
    return { answer: answer, toolResults: [{ toolName, output }], mode: "seeded" };
  } catch { return { answer: text[locale].fallback, toolResults: [], mode: "seeded" }; }
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
  const { userId, locale, city, messages, confirmSosToken } = parsed.data;
  if (!allow(`concierge:${userId}:${clientIp(request)}`, LIMIT) || !allow(`concierge-ip:${clientIp(request)}`, LIMIT * 3)) return NextResponse.json({ error: text[locale].limit }, { status: 429 });

  if (confirmSosToken) {
    const event = confirmSos(confirmSosToken, userId);
    return event ? NextResponse.json({ answer: text[locale].sos, toolResults: [{ toolName: "trigger_sos", output: { action: "sos_demo_recorded", event } }], mode: "demo" })
      : NextResponse.json({ error: text[locale].sosDenied }, { status: 400 });
  }
  if (!messages?.length) return NextResponse.json({ error: "Send a message to get started." }, { status: 400 });

  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  if (!process.env.LLM_API_KEY) return NextResponse.json(await offlineAnswer(lastUserMessage, city, userId, locale));

  try {
    const openai = createOpenAI({ apiKey: process.env.LLM_API_KEY, baseURL: process.env.LLM_BASE_URL || undefined });
    const tools = buildConciergeTools(userId);
    const result = await generateText({
      model: openai.chat(process.env.LLM_MODEL || "gpt-4o-mini"),
      system: `You are Silkora, a practical travel assistant for Uzbekistan. Reply in the user's language (${locale}: ${locale === "uz" ? "Uzbek" : locale === "ru" ? "Russian" : "English"}). Ground factual claims in results from search_places, search_packages, get_fair_price, get_scam_alerts, and get_weather before recommending specifics. Be honest when data is missing, stale, or illustrative. Never claim sample content is verified. Do not provide medical or legal certainty; give general information and direct people to qualified local professionals or official authorities. Ask for missing dates, guest count, or message before a booking request. Booking requests are pending demos and no provider or payment is contacted. For trigger_sos, the tool only prepares a confirmation; clearly ask the user to explicitly press the SOS confirmation button in the UI, and never claim that anyone was contacted. Host matching is not yet available. Current selected city is ${city}.`,
      messages: messages.map(({ role, content }) => ({ role, content })),
      tools,
      stopWhen: stepCountIs(5),
      maxOutputTokens: 700,
    });
    const toolResults = result.steps.flatMap((step) => step.toolResults.map((item) => ({ toolName: item.toolName, output: item.output })));
    return NextResponse.json({ answer: result.text || text[locale].fallback, toolResults, mode: "ai" });
  } catch {
    return NextResponse.json({ ...(await offlineAnswer(lastUserMessage, city, userId, locale)), mode: "seeded-error-fallback" });
  }
}
