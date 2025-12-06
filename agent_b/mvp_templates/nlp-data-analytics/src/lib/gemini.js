import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Initialize Gemini client - проверка API ключа
// @ai-sdk/google использует GOOGLE_GENERATIVE_AI_API_KEY, но мы поддерживаем GEMINI_API_KEY для совместимости
function validateApiKey() {
  // Проверяем обе переменные для совместимости
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  console.log('[Gemini] Проверка API ключа:', apiKey ? `Установлен (${apiKey.substring(0, 10)}...)` : 'НЕ УСТАНОВЛЕН!');
  console.log('[Gemini] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'установлен' : 'не установлен');
  console.log('[Gemini] GOOGLE_GENERATIVE_AI_API_KEY:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'установлен' : 'не установлен');
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY или GOOGLE_GENERATIVE_AI_API_KEY не установлен. Добавьте ключ в Environment Variables на Vercel');
  }
  
  if (apiKey.length < 20) {
    throw new Error('API ключ выглядит неверным (слишком короткий)');
  }
  
  // Устанавливаем GOOGLE_GENERATIVE_AI_API_KEY если используется GEMINI_API_KEY
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
    console.log('[Gemini] Установлен GOOGLE_GENERATIVE_AI_API_KEY из GEMINI_API_KEY');
  }
  
  return apiKey;
}

/**
 * Process natural language query and generate SQL or analysis
 */
export async function processNLQuery(query, dataSchema, sampleData) {
  try {
    console.log('[Gemini] Начало processNLQuery');
    console.log('[Gemini] Query:', query);
    console.log('[Gemini] Schema length:', dataSchema?.length);
    console.log('[Gemini] Sample data length:', sampleData?.length);
    
    // Validate API key
    validateApiKey();
    console.log('[Gemini] API ключ валиден');
    
    // Use gemini-2.5-flash - latest stable model supported by @ai-sdk/google
    const model = google('models/gemini-2.5-flash');
    console.log('[Gemini] Model создан: gemini-2.5-flash (via @ai-sdk/google)');

    const schemaDescription = generateSchemaDescription(dataSchema, sampleData);
    
    const prompt = `Ты - эксперт по анализу данных с глубоким пониманием статистики, визуализации и машинного обучения. Пользователь задал вопрос на естественном языке о данных.

Схема данных:
${schemaDescription}

Пример данных (первые строки):
${JSON.stringify(sampleData.slice(0, 3), null, 2)}

Вопрос пользователя: "${query}"

ДОСТУПНЫЕ ВОЗМОЖНОСТИ СИСТЕМЫ:

1. СТАТИСТИЧЕСКИЙ АНАЛИЗ:
   - Расширенные метрики: среднее (mean), медиана (median), мода (mode), минимум, максимум, сумма, количество
   - Стандартное отклонение (stdDev), дисперсия (variance)
   - Квартили (Q1, Q3, IQR) и процентили (P90, P95, P99)
   - Асимметрия (skewness) и эксцесс (kurtosis) для анализа распределения
   - Для числовых колонок автоматически вычисляются все метрики
   - Используй type: "statistics" для запросов типа "покажи статистику", "средние значения", "полная статистика"

2. ВИЗУАЛИЗАЦИЯ:
   - Доступны 4 типа графиков: "bar", "line", "pie", "scatter"
   - "bar" (столбчатая) - для сравнения категорий, группировки по категориям
   - "line" (линейная) - для временных рядов, трендов, изменений во времени
   - "pie" (круговая) - для распределения категориальных данных, долей, процентов
   - "scatter" (точечная) - для корреляций, зависимостей между двумя числовыми переменными
   - Используй type: "visualization" с указанием chartType, xAxis, yAxis

3. КОРРЕЛЯЦИОННЫЙ АНАЛИЗ:
   - Система автоматически вычисляет корреляционную матрицу для всех числовых колонок
   - Используй type: "correlations" или упомяни слова "корреляция", "зависимость", "correlation"
   - Система покажет heatmap с коэффициентами корреляции Пирсона

4. ОБРАБОТКА ДАТ:
   - Система автоматически определяет колонки с датами
   - Поддерживается группировка по периодам: день, неделя, месяц, год
   - Для временных рядов используй "line" график с датой на оси X

5. АНОМАЛИИ:
   - Система может найти аномальные значения (более 2 стандартных отклонений от среднего)
   - Используй слова "аномалии", "аномальные значения", "выбросы"

6. ФИЛЬТРАЦИЯ:
   - Пользователь может фильтровать данные через UI
   - Учитывай, что данные могут быть уже отфильтрованы

ТВОЯ ЗАДАЧА:
1. Внимательно проанализируй вопрос пользователя и данные
2. Определи, какой тип анализа нужен (статистика, визуализация, корреляции, аномалии)
3. Выбери подходящий тип графика, если нужна визуализация
4. Предложи осмысленный анализ с конкретными колонками из схемы данных
5. Дай понятное объяснение на русском языке
6. Сгенерируй структурированные инсайты (insights) - найди паттерны, аномалии, тренды и дай рекомендации
   - Паттерны: интересные закономерности в данных
   - Аномалии: необычные значения или выбросы
   - Тренды: направления изменений
   - Рекомендации: что можно сделать дальше для улучшения анализа

Верни ТОЛЬКО валидный JSON в формате:
{
  "type": "statistics" | "visualization" | "correlations" | "sql" | "text",
  "statistics": ["mean", "median", "count", "min", "max", "stdDev", "variance", "quartiles", "percentiles"] (если type = "statistics", укажи какие метрики нужны),
  "visualization": {
    "chartType": "line" | "bar" | "pie" | "scatter",
    "xAxis": "column_name" (название колонки из схемы),
    "yAxis": "column_name" (название колонки из схемы, для pie может быть null)
  },
  "description": "Краткое описание что будет сделано (1-2 предложения)",
  "message": "Подробный ответ пользователю на русском языке. Объясни что будет проанализировано, какие выводы можно сделать, что покажет визуализация. Будь конкретным и полезным.",
  "insights": [
    {
      "type": "pattern" | "anomaly" | "trend" | "recommendation",
      "title": "Краткий заголовок инсайта",
      "description": "Подробное описание инсайта с конкретными данными и выводами",
      "severity": "low" | "medium" | "high" (для аномалий и рекомендаций)
    }
  ]
}

ВАЖНО:
- Всегда используй реальные названия колонок из схемы данных
- Для временных рядов выбирай "line" график
- Для сравнения категорий - "bar" или "pie"
- Для корреляций - "scatter" или упомяни "correlations"
- Будь конкретным в описании и сообщении
- Если вопрос неясен, предложи несколько вариантов анализа`;

    console.log('[Gemini] Отправка промпта в модель...');
    console.log('[Gemini] Промпт длина:', prompt.length);
    
    const { text } = await generateText({
      model: model,
      prompt: prompt,
    });
    
    console.log('[Gemini] Ответ получен от модели');
    console.log('[Gemini] Текст ответа длина:', text.length);
    console.log('[Gemini] Текст ответа (первые 500 символов):', text.substring(0, 500));

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      console.log('[Gemini] JSON найден в ответе');
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('[Gemini] JSON успешно распарсен:', parsed);
        return parsed;
      } catch (parseError) {
        console.error('[Gemini] Ошибка парсинга JSON:', parseError);
        console.error('[Gemini] JSON текст:', jsonMatch[0]);
        throw new Error(`Ошибка парсинга JSON ответа: ${parseError.message}`);
      }
    }

    console.log('[Gemini] JSON не найден, возвращаем текстовый ответ');
    // Fallback if no JSON found
    return {
      type: 'text',
      message: text,
      description: 'Анализ выполнен'
    };
  } catch (error) {
    console.error('[Gemini] КРИТИЧЕСКАЯ ОШИБКА:', error);
    console.error('[Gemini] Error name:', error.name);
    console.error('[Gemini] Error message:', error.message);
    console.error('[Gemini] Error stack:', error.stack);
    
    // More detailed error message
    let errorMessage = `Ошибка обработки запроса: ${error.message}`;
    
    if (error.message.includes('API_KEY') || error.message.includes('api key') || error.message.includes('GEMINI_API_KEY')) {
      errorMessage = `GEMINI_API_KEY не установлен или неверный. Добавьте ключ в Environment Variables на Vercel.`;
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      errorMessage = `Превышен лимит запросов к Gemini API. Проверьте квоту.`;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = `Ошибка сети при обращении к Gemini API: ${error.message}`;
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      errorMessage = `Модель не найдена. Проверьте название модели. Используется: gemini-2.5-flash`;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Generate data analysis summary
 */
export async function generateDataSummary(data, columns) {
  try {
    validateApiKey();
    
    const model = google('models/gemini-2.5-flash');

    const sampleRows = data.slice(0, 10).map(row => 
      Object.values(row).join(', ')
    ).join('\n');

    const prompt = `Проанализируй данные и дай краткое саммари:

Колонки: ${columns.join(', ')}
Количество строк: ${data.length}

Примеры данных (первые 10 строк):
${sampleRows}

Дай краткое саммари на русском языке (2-3 предложения) о том, что представляют собой эти данные, какие основные паттерны видишь, есть ли аномалии.`;

    const { text } = await generateText({
      model: model,
      prompt: prompt,
    });
    
    return text;
  } catch (error) {
    console.error('Gemini summary error:', error);
    return 'Не удалось сгенерировать саммари данных';
  }
}

/**
 * Generate schema description for prompts
 */
function generateSchemaDescription(schema, sampleData) {
  if (!schema || schema.length === 0) {
    return 'Нет данных';
  }

  let description = 'Колонки:\n';
  schema.forEach(col => {
    const sampleValue = sampleData[0]?.[col] ?? 'N/A';
    description += `- ${col}: пример значения "${sampleValue}"\n`;
  });

  description += `\nВсего строк: ${sampleData.length}`;
  return description;
}
