// 直接通过 CDN 加载，这样 Vercel 100% 能认出这些函数
import { Solar, Lunar, Iziwei, ZiWeiSiHua } from 'https://esm.sh/lunar-javascript?bundle';

export default async function handler(req, res) {
  // 设置跨域头，确保 Base44 顺畅调用
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { date, school } = req.query;
    
    // 兼容多种日期格式，如果没传日期则默认今天
    let dateInput = date || new Date().toISOString();
    // 把 URL 里的 T 或空格换成标准格式
    const cleanDate = decodeURIComponent(dateInput).replace('T', ' ').replace(/\+/g, ' ');
    
    const dateObj = new Date(cleanDate);
    const solar = Solar.fromDate(dateObj);
    const lunar = solar.getLunar();

    // 流派设置 (0全书, 1中州, 2占验, 3常规)
    let sihuaType = 3; 
    if (school === 'zhongzhou') sihuaType = 1;
    if (school === 'quanshu') sihuaType = 0;
    ZiWeiSiHua.TYPE = sihuaType;

    const iZhiWei = Iziwei.fromLunar(lunar);
    const palaces = iZhiWei.getPalaces();

    // 构造 Base44 易读的数据格式
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
    // 如果失败，返回具体的错误详情
    return res.status(500).json({ 
      error: "排盘逻辑执行失败", 
      message: e.message 
    });
  }
}
