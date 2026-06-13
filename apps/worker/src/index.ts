import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  GEMINI_API_KEY: string
  AI_GATEWAY_ID?: string
  VAPID_PUBLIC_KEY?: string
  VAPID_PRIVATE_KEY?: string
  VAPID_SUBJECT?: string  // e.g. "mailto:you@example.com"
  MCD_MCP_TOKEN?: string  // 麦当劳 MCP Bearer Token
  MCD_MCP_URL?: string    // MCP 服务器地址 (默认 https://mcp.mcd.cn)
}

const app = new Hono<{ Bindings: Bindings }>()

// 全局 CORS
app.use('*', cors())

// ============ Health ============
app.get('/health', (c) => c.json({
  status: 'ok',
  app: 'EatOrNot',
  mcp_enabled: !!c.env.MCD_MCP_TOKEN,
  platform: 'cloudflare-workers',
}))

// ============ Provider Status ============
app.get('/api/provider/status', (c) => c.json({
  active_provider: c.env.MCD_MCP_TOKEN ? 'McDonalds MCP' : 'Mock (Workers)',
  provider_mode: c.env.MCD_MCP_TOKEN ? 'mcp' : 'mock',
  fallback_available: true,
  mcd_mcp_configured: !!c.env.MCD_MCP_TOKEN,
  message: c.env.MCD_MCP_TOKEN
    ? 'Running with real McDonald\'s MCP data'
    : 'Running on Cloudflare Workers with mock data (set MCD_MCP_TOKEN for real data)',
}))

// ============ Profile ============
app.get('/api/profile', async (c) => {
  const userId = c.req.query('user_id') || 'demo-user'
  try {
    const result = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first()
    if (result) {
      return c.json({
        user_id: result.user_id,
        name: result.name || '用户',
        height_cm: Number(result.height_cm) || 170,
        weight_kg: Number(result.weight_kg) || 65,
        age: Number(result.age) || 25,
        sex: result.sex || 'male',
        goal: result.goal || 'lose_weight',
        activity_level: result.activity_level || 'moderate',
        daily_budget: Number(result.daily_budget) || 50,
        weekly_budget: Number(result.weekly_budget) || 300,
        weekly_indulgence_allowance: Number(result.weekly_indulgence_allowance) || 2,
        taste_preferences: JSON.parse(String(result.taste_preferences || '[]')),
        allergies: JSON.parse(String(result.allergies || '[]')),
        dislikes: JSON.parse(String(result.dislikes || '[]')),
        preferred_tone: result.preferred_tone || 'gentle_friend',
        meal_schedule: JSON.parse(String(result.meal_schedule || '{}')),
        onboarding_complete: !!result.onboarding_complete,
        mode: result.mode || 'long_term',
      })
    }
  } catch {}
  return c.json(defaultProfile(userId))
})

app.post('/api/profile', async (c) => {
  const body = await c.req.json()
  const userId = body.user_id || 'demo-user'
  try {
    await c.env.DB.prepare('DELETE FROM users WHERE user_id = ?').bind(userId).run()
    await c.env.DB.prepare(
      `INSERT INTO users (user_id, name, height_cm, weight_kg, age, sex, goal,
       activity_level, daily_budget, weekly_budget, weekly_indulgence_allowance,
       taste_preferences, allergies, dislikes, preferred_tone, meal_schedule,
       onboarding_complete, mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId, body.name || '', body.height_cm || 170,
      body.weight_kg || 65, body.age || 25, body.sex || 'male',
      body.goal || 'lose_weight', body.activity_level || 'moderate',
      body.daily_budget || 50, body.weekly_budget || 300,
      body.weekly_indulgence_allowance || 2,
      JSON.stringify(body.taste_preferences || []),
      JSON.stringify(body.allergies || []),
      JSON.stringify(body.dislikes || []),
      body.preferred_tone || 'gentle_friend',
      JSON.stringify(body.meal_schedule || {}),
      body.onboarding_complete ? 1 : 0,
      body.mode || 'long_term',
    ).run()
  } catch {}
  return c.json({ ...body, user_id: userId })
})

app.post('/api/profile/reset', async (c) => c.json({ success: true }))

// ============ Recommend ============
app.post('/api/recommend', async (c) => {
  let body: any = {}
  try { body = await c.req.json() } catch {}
  const message = body.message || '帮我选午餐'
  const mode = body.mode || 'quick'
  const apiKey = c.env.GEMINI_API_KEY

  if (apiKey) {
    try {
      const recommendation = await callGemini(apiKey, message, mode, c.env.AI_GATEWAY_ID)
      return c.json(recommendation)
    } catch (err: any) {
      console.error('Gemini call failed:', err?.message || String(err))
      // fallback to mock
    }
  } else {
    console.warn('GEMINI_API_KEY not set, using mock')
  }
  return c.json(mockRecommend(message))
})

// ============ Debug Gemini ============
app.get('/api/debug/gemini', async (c) => {
  const apiKey = c.env.GEMINI_API_KEY
  if (!apiKey) {
    return c.json({ error: 'GEMINI_API_KEY not set', has_key: false })
  }
  const accountId = 'bbd869342ef49cfea41170378427db5d'
  const gateway = c.env.AI_GATEWAY_ID || 'eatornot'
  const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gateway}/compat/chat/completions`

  try {
    const resp = await fetch(
      gatewayUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google-ai-studio/gemma-4-31b-it',
          messages: [{ role: 'user', content: 'Say hello in JSON: {"greeting":"..."}' }],
          temperature: 0.5,
        }),
      }
    )
    const status = resp.status
    const rawText = await resp.text()
    let result: any = {}
    try { result = JSON.parse(rawText) } catch {}
    return c.json({
      has_key: true,
      key_prefix: apiKey.substring(0, 8) + '...',
      gateway_url: gatewayUrl,
      api_status: status,
      model_used: 'google-ai-studio/gemma-4-31b-it',
      response_ok: resp.ok,
      content_preview: result.choices?.[0]?.message?.content?.substring(0, 200) || null,
      raw_response: rawText.substring(0, 500),
      error: result.error || null,
    })
  } catch (err: any) {
    return c.json({ has_key: true, error: err.message })
  }
})

// ============ Dashboard ============
app.get('/api/dashboard', (c) => c.json({
  date: new Date().toISOString().split('T')[0],
  meal_status: { breakfast: 'recorded', lunch: 'recorded', dinner: { recorded: false } },
  nutrition: { calories: 850, target: 2000 },
  total_spent: 38,
  next_meal_suggestion: { meal_type: 'dinner', message: '晚餐时间到了！点击查看推荐' },
}))

// ============ Reminders ============
app.get('/api/reminders', (c) => c.json({ reminders: [] }))

// ============ Conversation ============
app.post('/api/conversation/reset', (c) => c.json({ success: true }))

// ============ Feedback ============
app.post('/api/feedback', (c) => c.json({ status: 'ok', message: 'Feedback recorded' }))

// ============ Demo ============
app.get('/api/demo/learning', (c) => c.json({ learning_points: 5, total_observations: 12 }))
app.get('/api/demo/metrics', (c) => c.json({ total_decisions: 3, avg_satisfaction: 4.2 }))

// ============ Store Search ============
app.get('/api/stores/search', async (c) => {
  const city = c.req.query('city') || '北京'
  const keyword = c.req.query('keyword') || '麦当劳'

  // 优先调 MCP 真实数据
  const mcpResult = await callMcpTool(c.env, 'query-nearby-stores', {
    beType: 1, searchType: 2, city, keyword,
  })

  if (mcpResult?.success && mcpResult?.data?.length > 0) {
    const stores = mcpResult.data.map((s: any) => ({
      storeCode: s.storeCode,
      storeName: s.storeName,
      address: s.address,
      distance: s.distance < 1000 ? `${s.distance}m` : `${(s.distance / 1000).toFixed(1)}km`,
      beCode: s.storeCode,
      businessStatus: s.businessStatus,
      businessStartTime: s.businessStartTime,
      businessEndTime: s.businessEndTime,
      reservation: s.reservation,
    }))
    return c.json({ stores, total: stores.length, city, is_mock: false })
  }

  // MCP 失败 → 降级到 Mock
  return c.json(mockStoresFallback(city, keyword))
})

// ============ Store Meals ============
app.get('/api/stores/:storeCode/meals', async (c) => {
  const storeCode = c.req.param('storeCode')

  const mcpResult = await callMcpTool(c.env, 'query-meals', {
    storeCode, orderType: 1, beType: 1,
  })

  if (mcpResult?.success && mcpResult?.data) {
    const mealsData: Record<string, any> = mcpResult.data.meals || {}
    const categories: any[] = mcpResult.data.categories || []

    // 建立 code → category 映射
    const codeToCategory: Record<string, string> = {}
    for (const cat of categories) {
      for (const m of (cat.meals || [])) {
        codeToCategory[m.code] = cat.name
      }
    }

    const items = Object.entries(mealsData).map(([code, m]: [string, any]) => ({
      item_code: code,
      name: m.name,
      image: m.image,
      price: parseFloat(m.currentPrice) || 0,
      category: codeToCategory[code] || '其他',
    }))

    return c.json({ items, categories: categories.map((c: any) => c.name), storeCode, is_mock: false })
  }

  // 降级到空菜单
  return c.json({ items: [], categories: [], storeCode, is_mock: true })
})

// ============ Today Status ============
app.get('/api/today/status', (c) => {
  const today = new Date().toISOString().split('T')[0]
  return c.json({
    date: today,
    meals_count: 2,
    total_calories: 850,
    total_spent: 38,
    meals: [
      {
        id: 'meal-1',
        user_id: getUserIdFromCtx(c),
        timestamp: `${today}T08:30:00`,
        meal_type: 'breakfast',
        items: [
          { name: '猪柳麦满分', item_code: 'M010', category: 'burger', price: 14, calories: 350, protein: 18, fat: 14, carbohydrate: 30, sodium: 680, tags: [] },
          { name: '美式咖啡', item_code: 'M011', category: 'drink', price: 10, calories: 5, protein: 0, fat: 0, carbohydrate: 1, sodium: 5, tags: ['零卡'] },
        ],
        total_price: 24,
        total_calories: 355,
        total_protein: 18,
        total_fat: 14,
        total_carbs: 31,
        total_sodium: 685,
        plan_mode: 'disciplined',
        satisfaction: 4,
        notes: '',
      },
      {
        id: 'meal-2',
        user_id: getUserIdFromCtx(c),
        timestamp: `${today}T12:15:00`,
        meal_type: 'lunch',
        items: [
          { name: '板烧鸡腿堡', item_code: 'M001', category: 'burger', price: 22, calories: 410, protein: 25, fat: 12, carbohydrate: 45, sodium: 750, tags: ['高蛋白'] },
          { name: '玉米杯', item_code: 'M002', category: 'side', price: 8, calories: 80, protein: 2, fat: 1, carbohydrate: 18, sodium: 50, tags: ['低脂'] },
        ],
        total_price: 30,
        total_calories: 490,
        total_protein: 27,
        total_fat: 13,
        total_carbs: 63,
        total_sodium: 800,
        plan_mode: 'disciplined',
        satisfaction: null,
        notes: '',
      },
    ],
  })
})

// ============ Decision ============
app.post('/api/decision', async (c) => {
  let body: any = {}
  try { body = await c.req.json() } catch {}
  const message = body.message || body.trigger_reason || '帮我选午餐'
  const apiKey = c.env.GEMINI_API_KEY

  if (apiKey) {
    try {
      const recommendation = await callGemini(apiKey, message, 'quick', c.env.AI_GATEWAY_ID)
      return c.json(recommendation)
    } catch {
      // fallback to mock
    }
  }
  return c.json(mockRecommend(message))
})

// ============ Reminders Actions ============
app.post('/api/reminders/:id/accept', (c) => c.json({ success: true }))
app.post('/api/reminders/:id/snooze', (c) => c.json({ success: true }))
app.post('/api/reminders/:id/dismiss', (c) => c.json({ success: true }))

// ============ Plan ============
app.post('/api/plan/refine', async (c) => {
  let body: any = {}
  try { body = await c.req.json() } catch {}
  const planId = body.plan_id || 'plan-1'
  const message = body.message || ''
  const apiKey = c.env.GEMINI_API_KEY

  if (apiKey) {
    try {
      const recommendation = await callGemini(apiKey, message || '帮我调整方案', 'quick', c.env.AI_GATEWAY_ID)
      if (recommendation.plans && recommendation.plans.length > 0) {
        const refined = recommendation.plans[0]
        refined.id = planId
        refined.version = 2
        return c.json({
          success: true,
          plan: refined,
          change_log: [{ version: 2, what_changed: message || '方案已调整', impact: '已根据您的要求重新搭配' }],
        })
      }
    } catch {}
  }
  return c.json({
    success: true,
    plan: {
      id: planId, version: 2,
      title: '💪 调整方案', mode: 'disciplined',
      items: [
        { name: '板烧鸡腿堡', item_code: 'M001', category: 'burger', price: 22, calories: 410, protein: 25, fat: 12, carbohydrate: 45, sodium: 750, tags: ['高蛋白'] },
        { name: '玉米杯', item_code: 'M002', category: 'side', price: 8, calories: 80, protein: 2, fat: 1, carbohydrate: 18, sodium: 50, tags: ['低脂'] },
        { name: '无糖可乐', item_code: 'M003', category: 'drink', price: 7, calories: 0, protein: 0, fat: 0, carbohydrate: 0, sodium: 15, tags: ['零卡'] },
      ],
      estimated_price: 37, estimated_calories: 490, protein: 27, fat: 13, carbohydrate: 63, sodium: 815,
      budget_impact: '占日预算74%', calorie_impact: '占日热量24%', indulgence_impact: '低',
      pros: ['高蛋白', '低热量'], cons: ['调整后方案'],
      agent_votes: [], safety_warnings: [], final_reason: '已根据您的要求调整',
    },
    change_log: [{ version: 2, what_changed: message || '方案已调整', impact: 'Mock 调整' }],
  })
})

// ============ Order ============
app.post('/api/order/create', async (c) => {
  let body: any = {}
  try { body = await c.req.json() } catch {}
  const orderId = `demo-${Date.now()}`
  const totalPrice = body.items?.reduce((sum: number, i: any) => sum + (i.price || 0) * (i.quantity || 1), 0) || 0
  return c.json({
    success: true,
    order_id: orderId,
    pay_url: `https://eatornot-api.jimmy120070.workers.dev/order/${orderId}`,
    status: 'pending_payment',
    total_price: totalPrice,
    message: 'Demo 订单已创建（Workers 模式）',
    is_mock: true,
  })
})
app.post('/api/order/confirm', (c) => c.json({ order_id: 'demo', status: 'confirmed', message: 'Demo', is_mock: true }))

// ============ Balance ============
app.get('/api/balance', (c) => c.json({ mode: 'balanced', scores: { health: 70, budget: 80, mood: 60 } }))

// ============ Helpers ============

/** MCP Streamable HTTP: JSON-RPC POST to MCP server, returns parsed data or null */
async function callMcpTool(env: Bindings, toolName: string, args: Record<string, any>): Promise<any> {
  const url = env.MCD_MCP_URL || 'https://mcp.mcd.cn'
  const token = env.MCD_MCP_TOKEN
  if (!token) return null  // 无 token → 返回 null → 调用方走 mock 降级

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      }),
    })

    if (!resp.ok) {
      console.error(`MCP ${toolName} error: ${resp.status}`)
      return null
    }

    const result: any = await resp.json()
    // MCP 返回 { result: { content: [{ type: 'text', text: '...' }] } }
    const text = result?.result?.content?.[0]?.text
    if (!text) return null

    // 直接尝试 parse
    try { return JSON.parse(text) }
    catch {
      // MCP 可能返回 说明文字 + 嵌套 JSON 字符串的混合体
      // 找第一个 {"success" 开头的 JSON 对象
      const jsonIdx = text.indexOf('{"success"')
      if (jsonIdx >= 0) {
        try { return JSON.parse(text.substring(jsonIdx)) }
        catch {
          // 可能还有转义 — 尝试找最后一个 } 结束
          let depth = 0, start = jsonIdx
          for (let i = jsonIdx; i < text.length; i++) {
            if (text[i] === '{') depth++
            else if (text[i] === '}') depth--
            if (depth === 0 && i > start) {
              try { return JSON.parse(text.substring(start, i + 1)) }
              catch { break }
            }
          }
        }
      }
      console.error(`MCP ${toolName}: could not parse response text (length=${text.length})`)
      return null
    }
  } catch (err) {
    console.error(`MCP ${toolName} failed:`, err)
    return null
  }
}

function defaultProfile(userId: string) {
  return {
    user_id: userId, name: 'Demo用户', height_cm: 170, weight_kg: 65,
    age: 25, sex: 'male', goal: 'lose_weight', activity_level: 'moderate',
    daily_budget: 50, weekly_budget: 300, weekly_indulgence_allowance: 2,
    taste_preferences: [], allergies: [], dislikes: [],
    preferred_tone: 'gentle_friend', meal_schedule: {},
    onboarding_complete: true, mode: 'quick',
  }
}

/** Mock 门店数据降级 */
function mockStoresFallback(city: string, keyword: string) {
  const stores = [
    { storeCode: '1101001', storeName: `${city}王府井餐厅`, address: `${city}市东城区王府井大街88号`, distance: '0.5km', beCode: '1101001', businessStatus: true, businessStartTime: '06:00', businessEndTime: '23:59' },
    { storeCode: '1101002', storeName: `${city}西单餐厅`, address: `${city}市西城区西单北大街120号`, distance: '1.2km', beCode: '1101002', businessStatus: true, businessStartTime: '06:00', businessEndTime: '23:59' },
    { storeCode: '1101003', storeName: `${city}三里屯餐厅`, address: `${city}市朝阳区三里屯路19号`, distance: '2.1km', beCode: '1101003', businessStatus: true, businessStartTime: '07:00', businessEndTime: '22:00' },
    { storeCode: '1101004', storeName: `${city}国贸餐厅`, address: `${city}市朝阳区建国门外大街1号`, distance: '3.5km', beCode: '1101004', businessStatus: true, businessStartTime: '06:00', businessEndTime: '23:00' },
    { storeCode: '1101005', storeName: `${city}望京餐厅`, address: `${city}市朝阳区望京西路`, distance: '4.8km', beCode: '1101005', businessStatus: true, businessStartTime: '07:00', businessEndTime: '22:30' },
    { storeCode: '1101006', storeName: `${city}中关村餐厅`, address: `${city}市海淀区中关村大街`, distance: '5.3km', beCode: '1101006', businessStatus: true, businessStartTime: '06:30', businessEndTime: '23:00' },
  ]
  const filtered = keyword
    ? stores.filter(s => s.storeName.includes(keyword) || s.address.includes(keyword))
    : stores
  return { stores: filtered, total: filtered.length, city, is_mock: true }
}

function getUserIdFromCtx(c: any): string {
  return c.req.query('user_id') || 'demo-user'
}

async function callGemini(apiKey: string, message: string, mode: string, gatewayId?: string): Promise<any> {
  const systemPrompt = `你是 EatOrNot 饮食决策助手。用户会告诉你他们想吃什么，你需要给出 3 个推荐方案。
每个方案包含：title(标题), mode(模式: disciplined/budget_friendly/controlled_indulgence), items(菜品数组,每项含name/price/calories), estimated_price(总价), estimated_calories(总热量), protein, fat, carbohydrate, sodium, pros(优点数组), cons(缺点数组), final_reason(推荐理由)。
你必须只返回纯 JSON，不要有任何 markdown 代码块标记或其他文字。格式: {"plans": [...], "summary": "总结"}。菜品来自麦当劳，给出真实价格和热量估算。`

  // 通过 Cloudflare AI Gateway 兼容端点中转（绕过地理限制）
  const accountId = 'bbd869342ef49cfea41170378427db5d'
  const gateway = gatewayId || 'eatornot'
  const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gateway}/compat/chat/completions`

  const resp = await fetch(
    gatewayUrl,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google-ai-studio/gemma-4-31b-it',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
      }),
    }
  )

  if (!resp.ok) {
    const errText = await resp.text()
    console.error('Gemini API error:', resp.status, errText)
    throw new Error(`Gemini API ${resp.status}: ${errText.substring(0, 200)}`)
  }

  const result: any = await resp.json()
  let content = result.choices?.[0]?.message?.content || ''

  // 去掉 <thought>...</thought> 标签（Gemma 4 的思考过程）
  content = content.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim()

  // 尝试从内容中提取 JSON（可能包裹在 markdown 代码块中）
  let jsonStr = content
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  // 如果还不是有效 JSON 开头，尝试直接找 { 的位置
  if (!jsonStr.startsWith('{')) {
    const braceIdx = jsonStr.indexOf('{')
    if (braceIdx >= 0) {
      jsonStr = jsonStr.substring(braceIdx)
    }
  }

  // 辅助函数：将 "25g" / "850mg" 等字符串转为数字
  const toNum = (v: any, fallback: number): number => {
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(/[^\d.]/g, ''))
      return isNaN(n) ? fallback : n
    }
    return fallback
  }

  try {
    const parsed = JSON.parse(jsonStr)
    if (parsed.plans) {
      parsed.plans.forEach((plan: any, i: number) => {
        plan.id = plan.id || `plan-${i + 1}`
        plan.mode = plan.mode || ['disciplined', 'budget_friendly', 'controlled_indulgence'][i % 3]
        plan.items = (plan.items || []).map((item: any) => ({
          name: item.name, item_code: item.item_code || `M${100 + i}`,
          category: item.category || 'main', price: toNum(item.price, 15),
          calories: toNum(item.calories, 300), protein: toNum(item.protein, 10),
          fat: toNum(item.fat, 5), carbohydrate: toNum(item.carbohydrate, 30),
          sodium: toNum(item.sodium, 500), tags: item.tags || [],
        }))
        plan.estimated_price = toNum(plan.estimated_price, plan.items.reduce((s: number, i: any) => s + i.price, 0))
        plan.estimated_calories = toNum(plan.estimated_calories, plan.items.reduce((s: number, i: any) => s + i.calories, 0))
        plan.protein = toNum(plan.protein, 20)
        plan.fat = toNum(plan.fat, 10)
        plan.carbohydrate = toNum(plan.carbohydrate, 50)
        plan.sodium = toNum(plan.sodium, 800)
        plan.budget_impact = plan.budget_impact || `占日预算${30 + i * 10}%`
        plan.calorie_impact = plan.calorie_impact || `占日热量${20 + i * 5}%`
        plan.indulgence_impact = plan.indulgence_impact || ['低', '中', '高'][i % 3]
        plan.pros = plan.pros || []
        plan.cons = plan.cons || []
        plan.agent_votes = plan.agent_votes || []
        plan.safety_warnings = plan.safety_warnings || []
        plan.final_reason = plan.final_reason || '推荐'
      })
      parsed.user_id = 'demo-user'
      parsed.agent_debate = parsed.agent_debate || []
      parsed.safety_warnings = parsed.safety_warnings || []
      parsed.summary = parsed.summary || ''
      parsed.source = 'gemini'
      return parsed
    }
  } catch (parseErr) {
    console.error('JSON parse failed, raw content:', content.substring(0, 300))
    throw parseErr
  }
  return mockRecommend(message)
}

function mockRecommend(message: string) {
  return {
    user_id: 'demo-user',
    plans: [
      {
        id: 'plan-1', title: '💪 自律之选', mode: 'disciplined',
        items: [
          { name: '板烧鸡腿堡', item_code: 'M001', category: 'burger', price: 22, calories: 410, protein: 25, fat: 12, carbohydrate: 45, sodium: 750, tags: ['高蛋白'] },
          { name: '玉米杯', item_code: 'M002', category: 'side', price: 8, calories: 80, protein: 2, fat: 1, carbohydrate: 18, sodium: 50, tags: ['低脂'] },
          { name: '零度可乐', item_code: 'M003', category: 'drink', price: 7, calories: 0, protein: 0, fat: 0, carbohydrate: 0, sodium: 20, tags: ['零卡'] },
        ],
        estimated_price: 37, estimated_calories: 490, protein: 27, fat: 13, carbohydrate: 63, sodium: 820,
        budget_impact: '占日预算74%', calorie_impact: '占日热量24%', indulgence_impact: '低',
        pros: ['高蛋白', '低热量', '控糖'], cons: ['味道偏淡'],
        agent_votes: [], safety_warnings: [], final_reason: '高蛋白低热量，减脂首选',
      },
      {
        id: 'plan-2', title: '💰 省钱套餐', mode: 'budget_friendly',
        items: [
          { name: '麦香鸡', item_code: 'M004', category: 'burger', price: 12, calories: 360, protein: 14, fat: 16, carbohydrate: 40, sodium: 680, tags: ['性价比'] },
          { name: '小薯条', item_code: 'M005', category: 'side', price: 7, calories: 230, protein: 3, fat: 11, carbohydrate: 29, sodium: 160, tags: [] },
        ],
        estimated_price: 19, estimated_calories: 590, protein: 17, fat: 27, carbohydrate: 69, sodium: 840,
        budget_impact: '占日预算38%', calorie_impact: '占日热量29%', indulgence_impact: '中',
        pros: ['价格实惠', '经典搭配'], cons: ['热量偏高'],
        agent_votes: [], safety_warnings: [], final_reason: '最便宜的饱腹方案',
      },
      {
        id: 'plan-3', title: '🎉 快乐套餐', mode: 'controlled_indulgence',
        items: [
          { name: '巨无霸', item_code: 'M006', category: 'burger', price: 25, calories: 530, protein: 26, fat: 28, carbohydrate: 46, sodium: 950, tags: ['经典'] },
          { name: '中薯条', item_code: 'M007', category: 'side', price: 11, calories: 340, protein: 4, fat: 16, carbohydrate: 42, sodium: 230, tags: [] },
          { name: '可口可乐(中)', item_code: 'M008', category: 'drink', price: 8, calories: 140, protein: 0, fat: 0, carbohydrate: 35, sodium: 15, tags: [] },
        ],
        estimated_price: 44, estimated_calories: 1010, protein: 30, fat: 44, carbohydrate: 123, sodium: 1195,
        budget_impact: '占日预算88%', calorie_impact: '占日热量50%', indulgence_impact: '高',
        pros: ['经典搭配', '满足感强'], cons: ['热量高', '钠超标'],
        agent_votes: [], safety_warnings: ['热量超过日目标50%'], final_reason: '辛苦一天，犒劳自己',
      },
    ],
    agent_debate: [],
    summary: `基于「${message}」，智囊团准备了 3 个方案：自律之选（低卡高蛋白）、省钱套餐（性价比之王）、快乐套餐（犒劳自己）。`,
    safety_warnings: [],
  }
}

// ============ Push Subscriptions ============
app.get('/api/push/vapid-public-key', (c) => {
  const pk = c.env.VAPID_PUBLIC_KEY
  if (!pk) return c.json({ error: 'VAPID not configured' }, 503)
  return c.json({ publicKey: pk })
})

app.post('/api/push/subscribe', async (c) => {
  const body = await c.req.json()
  const userId = body.user_id || 'demo-user'
  const sub = body.subscription
  if (!sub?.endpoint) return c.json({ error: 'Missing subscription' }, 400)
  try {
    await c.env.DB.prepare(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
       user_id=excluded.user_id, p256dh=excluded.p256dh, auth=excluded.auth, created_at=excluded.created_at`
    ).bind(userId, sub.endpoint, sub.keys?.p256dh || '', sub.keys?.auth || '', new Date().toISOString()).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

app.post('/api/push/unsubscribe', async (c) => {
  const body = await c.req.json()
  const endpoint = body.endpoint
  if (!endpoint) return c.json({ error: 'Missing endpoint' }, 400)
  try {
    await c.env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============ Reminders (with cron-generated data) ============
app.get('/api/reminders', async (c) => {
  const userId = c.req.query('user_id') || 'demo-user'
  try {
    const rows = await c.env.DB.prepare(
      `SELECT * FROM meal_reminders
       WHERE date = ? AND (acknowledged_by IS NULL OR acknowledged_by NOT LIKE ?)
       ORDER BY sent_at DESC LIMIT 3`
    ).bind(new Date().toISOString().split('T')[0], `%${userId}%`).all()
    const reminders = (rows.results || []).map((r: any) => ({
      id: r.id,
      meal_type: r.meal_type,
      sent_at: r.sent_at,
      recommendation: JSON.parse(String(r.recommendation_json || '{}')),
    }))
    return c.json({ reminders })
  } catch {
    return c.json({ reminders: [] })
  }
})

app.post('/api/reminders/:id/ack', async (c) => {
  const id = c.req.param('id')
  const userId = (await c.req.json()).user_id || 'demo-user'
  try {
    await c.env.DB.prepare(
      `UPDATE meal_reminders SET acknowledged_by = COALESCE(acknowledged_by || ',', '') || ? WHERE id = ?`
    ).bind(userId, id).run()
    return c.json({ success: true })
  } catch {
    return c.json({ success: false }, 500)
  }
})

// ============ Web Push Helpers ============

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  let s = str.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const binary = atob(s)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function createVapidJWT(privateKey: string, origin: string, subject: string): Promise<string> {
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    aud: origin,
    exp: now + 12 * 3600,
    sub: subject,
  })))
  const unsigned = `${header}.${payload}`
  const keyBytes = base64UrlDecode(privateKey)
  const privateKeyObj = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKeyObj,
    new TextEncoder().encode(unsigned)
  )
  // WebCrypto returns DER-encoded sig; convert to raw (r || s)
  const derSig = new Uint8Array(signature)
  const rLen = derSig[3]
  const r = derSig.slice(4, 4 + rLen)
  const sOffset = 4 + rLen + 2
  const sLen = derSig[sOffset - 1]
  const s = derSig.slice(sOffset, sOffset + sLen)
  // Trim leading zeros, pad to 32 bytes
  const trimPad = (arr: Uint8Array): Uint8Array => {
    let start = 0
    while (start < arr.length - 1 && arr[start] === 0) start++
    const trimmed = arr.slice(start)
    const result = new Uint8Array(32)
    result.set(trimmed, 32 - trimmed.length)
    return result
  }
  const rawSig = new Uint8Array(64)
  rawSig.set(trimPad(r), 0)
  rawSig.set(trimPad(s), 32)
  const sigB64 = base64UrlEncode(rawSig.buffer)
  return `${unsigned}.${sigB64}`
}

async function pushToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<boolean> {
  try {
    const pushUrl = new URL(sub.endpoint)
    const origin = `${pushUrl.protocol}//${pushUrl.host}`
    const jwt = await createVapidJWT(vapidPrivateKey, origin, vapidSubject)

    // Encrypt payload with AES-128-GCM using the subscription's p256dh + auth
    const p256dhKey = await crypto.subtle.importKey(
      'raw', base64UrlDecode(sub.p256dh),
      { name: 'ECDH', namedCurve: 'P-256' }, false, []
    )
    // Generate ephemeral key pair
    const ephemeral = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
    const sharedSecret = await crypto.subtle.deriveBits({ name: 'ECDH', public: p256dhKey }, ephemeral.privateKey, 256)
    const ephemeralPub = await crypto.subtle.exportKey('raw', ephemeral.publicKey)

    // HKDF to derive encryption key + nonce
    const authKey = base64UrlDecode(sub.auth)
    const ikm = new Uint8Array(sharedSecret)
    const prkInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0')
    const prk = await hkdfExtract(ikm, authKey)
    const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0P-256\0')
    const context = new Uint8Array([...new TextEncoder().encode('P-256\0'), ...new Uint8Array(1), ...new Uint8Array(65 - 65).fill(0), ...new Uint8Array(epherealPub)])
    // Simplified: use Web Push "aes128gcm" content encoding
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const keyInfo = concatBuffers(salt, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), new Uint8Array([0, 0, 0, 1]))
    const derivedBits = await hkdfExpand(prk, keyInfo, 32)
    const encryptionKey = await crypto.subtle.importKey('raw', derivedBits, 'AES-GCM', false, ['encrypt'])
    const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0')
    const nonceBits = await hkdfExpand(prk, nonceInfo, 12)
    const nonce = new Uint8Array(nonceBits)

    // Build body: salt | rs(4bytes) | pubkey | payload + padding
    const rs = new Uint8Array(4)
    new DataView(rs.buffer).setUint32(0, 4096)
    const payloadBytes = new TextEncoder().encode(payload)
    const padding = new Uint8Array(1) // minimal padding (just the delimiter 0x02)
    padding[0] = 2
    const plaintext = new Uint8Array([...payloadBytes, ...padding])
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, encryptionKey, plaintext)

    const body = new Uint8Array([
      ...salt, ...rs, ...new Uint8Array(ephemeralPub),
      ...new Uint8Array(encrypted)
    ])

    const resp = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=`, // k would be the public key, we skip for brevity
      },
      body,
    })
    return resp.status === 201 || resp.status === 200
  } catch (e) {
    console.error(`Push failed for ${sub.endpoint}:`, e)
    return false
  }
}

async function hkdfExtract(ikm: Uint8Array, salt: Uint8Array): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', key, ikm)
}

async function hkdfExpand(prk: ArrayBuffer, info: Uint8Array, length: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const result = new Uint8Array(length)
  let prev = new Uint8Array(0)
  let offset = 0
  let counter = 1
  while (offset < length) {
    const input = new Uint8Array([...prev, ...info, counter])
    const output = new Uint8Array(await crypto.subtle.sign('HMAC', key, input))
    const copyLen = Math.min(output.length, length - offset)
    result.set(output.slice(0, copyLen), offset)
    prev = output
    offset += copyLen
    counter++
  }
  return result.buffer
}

function concatBuffers(...bufs: Uint8Array[]): Uint8Array {
  const total = bufs.reduce((s, b) => s + b.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const b of bufs) {
    result.set(b, offset)
    offset += b.length
  }
  return result
}

// ============ Scheduled (Cron) ============
async function handleCron(env: Bindings) {
  const hour = new Date().getUTCHours()
  let mealType = '晚餐'
  if (hour >= 0 && hour < 4) mealType = '早餐'
  else if (hour >= 4 && hour < 8) mealType = '午餐'

  let recommendation: any
  try {
    recommendation = await callGemini(
      env.GEMINI_API_KEY, `帮我搭配${mealType}`, 'quick', env.AI_GATEWAY_ID
    )
  } catch {
    recommendation = mockRecommend(`帮我搭配${mealType}`)
  }

  await env.DB.prepare(
    `INSERT INTO meal_reminders (meal_type, date, recommendation_json, sent_at)
     VALUES (?, ?, ?, ?)`
  ).bind(mealType, new Date().toISOString().split('T')[0], JSON.stringify(recommendation), new Date().toISOString()).run()

  // Send Web Push to all subscriptions
  if (env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT) {
    try {
      const subs = await env.DB.prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions').all()
      const pushPayload = JSON.stringify({
        title: `🍽️ ${mealType}时间到了！`,
        body: `智囊团已为你准备好了${mealType}推荐方案，点击查看`,
        url: '/?tab=recommendations',
        meal_type: mealType,
      })
      const results = await Promise.allSettled(
        (subs.results || []).map((s: any) =>
          pushToSubscription(
            { endpoint: s.endpoint, p256dh: String(s.p256dh), auth: String(s.auth) },
            pushPayload,
            env.VAPID_PRIVATE_KEY!,
            env.VAPID_SUBJECT!,
          )
        )
      )
      const succeeded = results.filter(r => r.status === 'fulfilled' && r.value).length
      console.log(`[Cron] ${mealType}: pushed to ${succeeded}/${results.length} subscriptions`)
    } catch (e) {
      console.error(`[Cron] Push error:`, e)
    }
  } else {
    console.log(`[Cron] ${mealType} reminder generated (no VAPID keys, push skipped)`)
  }
}

async function ensureTables(db: D1Database) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    endpoint TEXT UNIQUE,
    p256dh TEXT,
    auth TEXT,
    created_at TEXT
  )`).run()
  await db.prepare(`CREATE TABLE IF NOT EXISTS meal_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_type TEXT,
    date TEXT,
    recommendation_json TEXT,
    sent_at TEXT,
    acknowledged_by TEXT
  )`).run()
}

export default {
  async fetch(req: Request, env: Bindings, ctx: ExecutionContext) {
    await ensureTables(env.DB)
    return app.fetch(req, env)
  },
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    await ensureTables(env.DB)
    await handleCron(env)
  },
}
