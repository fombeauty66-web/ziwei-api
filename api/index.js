import { Solar, Lunar, Iziwei, ZiWeiSiHua } from 'lunar-javascript';

export default async function handler(req, res) {
  // 1. 设置跨域头 (Base44 必备)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 处理浏览器预检
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. 获取 URL 参数：?date=2026-03-28 10:00&school=zhongzhou
    const { date, school } = req.query;
    const dateStr = date || '2026-03-28 10:00';
    
    const solar = Solar.fromDate(new Date(dateStr.replace('%20', ' ')));
    const lunar = solar.getLunar();

    // 3. 流派设置 (0全书, 1中州, 2占验, 3常规)
    let sihuaType = 3; 
    if (school === 'zhongzhou') sihuaType = 1;
    if (school === 'quanshu') sihuaType = 0;
    ZiWeiSiHua.TYPE = sihuaType;

    const iZhiWei = Iziwei.fromLunar(lunar);
    const palaces = iZhiWei.getPalaces();

    // 4. 构造 Base44 易读的数据格式
    const result = {
      info: {
        bazi: lunar.getEightChar().toString(),
        wuxing: iZhiWei.getWuXing(),
        solarDate: solar.toFullString(),
        lunarDate: lunar.toFullString()
      },
      palaces: palaces.map(p => ({
        name: p.getName(),
        dz: p.getZhi(),
        stars: p.getMajorStars(),
        sihua: p.getSiHua() || '',
        decade: p.getDecade()
      }))
    };

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: "排盘异常", detail: e.message });
  }
}
