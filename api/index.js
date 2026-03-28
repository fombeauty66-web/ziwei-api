const { Solar, Lunar, Iziwei, ZiWeiSiHua } = require('lunar-javascript');

module.exports = async (req, res) => {
  // 设置跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date, school } = req.query;
    
    // 基础日期处理
    let dateStr = date || '2026-03-28 12:00:00';
    // 简单的格式清洗，防止日期报错
    const finalDate = dateStr.replace('T', ' ').replace(/\+/g, ' ');
    
    const solar = Solar.fromDate(new Date(finalDate));
    const lunar = solar.getLunar();

    // 流派逻辑
    let sihuaType = 3; 
    if (school === 'zhongzhou') sihuaType = 1;
    if (school === 'quanshu') sihuaType = 0;
    ZiWeiSiHua.TYPE = sihuaType;

    const iZhiWei = Iziwei.fromLunar(lunar);
    const palaces = iZhiWei.getPalaces();

    // 构造结果
    const result = {
      info: {
        bazi: lunar.getEightChar().toString(),
        wuxing: iZhiWei.getWuXing(),
        solarDate: solar.toFullString()
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
      error: "服务器内部算力异常", 
      detail: e.message 
    });
  }
};
