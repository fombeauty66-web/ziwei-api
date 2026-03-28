const lunar = require('lunar-javascript');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date, school } = req.query;
    let dateStr = date || '2026-03-28 12:00:00';
    const finalDate = dateStr.replace('T', ' ').replace(/\+/g, ' ');
    
    // 1. 基础历法
    const solar = lunar.Solar.fromDate(new Date(finalDate));
    const lunarDate = solar.getLunar();

    // 2. 寻找紫微引擎 (在这个版本里它是 Iziwei)
    const Engine = lunar.Iziwei;
    
    if (!Engine) {
      // 如果找不到，尝试从深度路径直接抓取
      throw new Error("紫微模块未激活，当前库内含有的模块有: " + Object.keys(lunar).join(','));
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
      error: "排盘引擎最终调试", 
      detail: e.message,
      keys: Object.keys(lunar)
    });
  }
};
