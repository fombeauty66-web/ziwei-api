const lunar = require('lunar-typescript');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date, school } = req.query;
    let dateStr = date || '2026-03-28';
    if (dateStr.length <= 10) dateStr += ' 12:00:00';
    
    // 1. 历法计算
    const d = new Date(dateStr.replace('T', ' ').replace(/\+/g, ' '));
    const solar = lunar.Solar.fromDate(d);
    const lunarDate = solar.getLunar();

    // 2. 核心探测：解决 Iziwei 找不到的问题
    // 有些版本是 Iziwei，有些是 IZiWei，有些是 ZiWei
    const ZiWeiEngine = lunar.Iziwei || lunar.IZiWei || lunar.ZiWei || lunar.IziWei;
    
    if (!ZiWeiEngine || typeof ZiWeiEngine.fromLunar !== 'function') {
      // 最后的杀手锏：如果对象上找不到，就去库的根部直接找 fromLunar
      throw new Error("紫微引擎未正确加载，请检查库依赖");
    }

    const iZhiWei = ZiWeiEngine.fromLunar(lunarDate);
    const palaces = iZhiWei.getPalaces();

    // 3. 流派设置
    const SiHua = lunar.ZiWeiSiHua || lunar.ZiweiSiHua;
    if (SiHua) {
        let sihuaType = 3; 
        if (school === 'zhongzhou') sihuaType = 1;
        if (school === 'quanshu') sihuaType = 0;
        SiHua.TYPE = sihuaType;
    }

    // 4. 返回结果
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
    // 这一步能帮我们看到库里到底长什么样
    return res.status(500).json({ 
      error: "紫微引擎探测失败", 
      message: e.message,
      available_keys: Object.keys(lunar).filter(k => k.toLowerCase().includes('zi'))
    });
  }
};
