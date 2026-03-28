// 兼容 CommonJS 模式的读取方式
const lunar = require('lunar-javascript');
const { Solar, Lunar, Iziwei, ZiWeiSiHua } = lunar;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date, school } = req.query;
    
    // 自动补全时间，防止 Date 解析失败
    let dateStr = date || '2026-03-28';
    if (dateStr.length <= 10) dateStr += ' 12:00:00';
    
    const finalDate = dateStr.replace('T', ' ').replace(/\+/g, ' ');
    const solar = Solar.fromDate(new Date(finalDate));
    const currentLunar = solar.getLunar();

    // 设置流派 (0全书, 1中州, 2占验, 3常规)
    let sihuaType = 3; 
    if (school === 'zhongzhou') sihuaType = 1;
    if (school === 'quanshu') sihuaType = 0;
    
    // 在 CommonJS 模式下，这样设置 TYPE
    if (ZiWeiSiHua) {
        ZiWeiSiHua.TYPE = sihuaType;
    }

    const iZhiWei = Iziwei.fromLunar(currentLunar);
    const palaces = iZhiWei.getPalaces();

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
      error: "算力引擎启动成功但数据解析失败", 
      detail: e.message 
    });
  }
};
