const lunar = require('lunar-typescript');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date, school } = req.query;
    let dateStr = date || '2026-03-28';
    if (dateStr.length <= 10) dateStr += ' 12:00:00';
    
    // 1. 使用库的绝对路径计算历法
    const solar = lunar.Solar.fromDate(new Date(dateStr.replace('T', ' ').replace(/\+/g, ' ')));
    const lunarDate = solar.getLunar();

    // 2. 设置流派 (直接通过根对象设置)
    if (lunar.ZiWeiSiHua) {
        let sihuaType = 3; 
        if (school === 'zhongzhou') sihuaType = 1;
        if (school === 'quanshu') sihuaType = 0;
        lunar.ZiWeiSiHua.TYPE = sihuaType;
    }

    // 3. 紫微排盘 (直接通过根对象调用 Iziwei)
    const iZhiWei = lunar.Iziwei.fromLunar(lunarDate);
    const palaces = iZhiWei.getPalaces();

    // 4. 封装最终数据
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
      error: "紫微引擎最后一步配置异常", 
      detail: e.message 
    });
  }
};
