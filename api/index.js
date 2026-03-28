const { Solar, Iziwei, ZiWeiSiHua } = require('lunar-typescript');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date, school } = req.query;
    let dateStr = date || '2026-03-28';
    if (dateStr.length <= 10) dateStr += ' 12:00:00';
    
    // 1. 计算历法
    const solar = Solar.fromDate(new Date(dateStr.replace('T', ' ').replace(/\+/g, ' ')));
    const lunarDate = solar.getLunar();

    // 2. 设置流派
    let sihuaType = 3; 
    if (school === 'zhongzhou') sihuaType = 1;
    if (school === 'quanshu') sihuaType = 0;
    ZiWeiSiHua.TYPE = sihuaType;

    // 3. 紫微排盘 (在新库中这个路径非常稳)
    const iZhiWei = Iziwei.fromLunar(lunarDate);
    const palaces = iZhiWei.getPalaces();

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
        stars: p.getMajorStars().concat(p.getMinorStars()), // 把主星和辅星都吐出来
        sihua: p.getSiHua() || '',
        decade: p.getDecade()
      }))
    };

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ 
      error: "紫微引擎启动失败", 
      detail: e.message 
    });
  }
};
