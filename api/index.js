const lunar = require('lunar-javascript');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date, school } = req.query;
    let dateStr = date || '2026-03-28';
    if (dateStr.length <= 10) dateStr += ' 12:00:00';
    const finalDate = dateStr.replace('T', ' ').replace(/\+/g, ' ');
    
    const solar = lunar.Solar.fromDate(new Date(finalDate));
    const currentLunar = solar.getLunar();

    // 自动寻找排盘引擎（解决大小写不一致问题）
    const Engine = lunar.Iziwei || lunar.IZiWei || lunar.IziWei || lunar.ZiWei;
    
    if (!Engine) {
        throw new Error("找不到排盘引擎，请检查库版本");
    }

    const iZhiWei = Engine.fromLunar(currentLunar);
    const palaces = iZhiWei.getPalaces();

    // 流派设置
    if (lunar.ZiWeiSiHua) {
        let sihuaType = 3; 
        if (school === 'zhongzhou') sihuaType = 1;
        if (school === 'quanshu') sihuaType = 0;
        lunar.ZiWeiSiHua.TYPE = sihuaType;
    }

    const result = {
      info: {
        bazi: currentLunar.getEightChar().toString(),
        wuxing: iZhiWei.getWuXing(),
        solarDate: solar.toFullString(),
        lunarDate: currentLunar.toFullString()
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
    return res.status(500).json({ 
      error: "环境探测成功但执行逻辑失败", 
      detail: e.message,
      keys: Object.keys(lunar) // 这一行能帮我看到库里到底有哪些可用的名字
    });
  }
};
