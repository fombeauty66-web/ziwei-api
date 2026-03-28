const lunar = require('lunar-javascript');

module.exports = async (req, res) => {
  // 设置跨域和字符集
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date, school } = req.query;
    let dateStr = date || '2026-03-28 12:00:00';
    const finalDate = dateStr.replace('T', ' ').replace(/\+/g, ' ');
    
    // 1. 基础历法计算
    const solar = lunar.Solar.fromDate(new Date(finalDate));
    const lunarDate = solar.getLunar();

    // 2. 核心排盘：在这个版本中直接调用 Iziwei
    const Engine = lunar.Iziwei;
    
    if (!Engine) {
      throw new Error("库已加载，但紫微模块(Iziwei)仍不存在。当前可用模块：" + Object.keys(lunar).slice(0, 10).join(', '));
    }

    const iZhiWei = Engine.fromLunar(lunarDate);
    const palaces = iZhiWei.getPalaces();

    // 3. 流派设置
    if (lunar.ZiWeiSiHua) {
        let sihuaType = 3; 
        if (school === 'zhongzhou') sihuaType = 1;
        if (school === 'quanshu') sihuaType = 0;
        lunar.ZiWeiSiHua.TYPE = sihuaType;
    }

    // 4. 结果构造
    const result = {
      info: {
        bazi: lunarDate.getEightChar().toString(),
        wuxing: iZhiWei.getWuXing(),
        solarDate: solar.toFullString(),
        lunarDate: lunarDate.toFullString()
      },
      palaces: palaces.map(p => ({
        name: p.getName(),
        dz: p.getZhi(),
        stars: p.getMajorStars().concat(p.getMinorStars()), 
        sihua: p.getSiHua() || '',
        decade: p.getDecade()
      }))
    };

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ 
      error: "排盘异常", 
      detail: e.message,
      keys: Object.keys(lunar) 
    });
  }
};
