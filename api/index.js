// 使用 CommonJS 模式的最稳妥读取方式
const lunar = require('lunar-javascript');

module.exports = async (req, res) => {
  // 设置跨域和编码
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date, school } = req.query;
    
    // 1. 处理日期：如果没传则默认今天，补全时间
    let dateStr = date || '2026-03-28';
    if (dateStr.length <= 10) dateStr += ' 12:00:00';
    const finalDate = dateStr.replace('T', ' ').replace(/\+/g, ' ');
    
    // 2. 核心历法计算 (从大对象中精准抓取函数)
    const solar = lunar.Solar.fromDate(new Date(finalDate));
    const currentLunar = solar.getLunar();

    // 3. 设置流派 (0全书, 1中州, 2占验, 3常规)
    let sihuaType = 3; 
    if (school === 'zhongzhou') sihuaType = 1;
    if (school === 'quanshu') sihuaType = 0;
    
    // 在 CommonJS 模式下设置四化流派
    if (lunar.ZiWeiSiHua) {
        lunar.ZiWeiSiHua.TYPE = sihuaType;
    }

    // 4. 排盘 (使用精准的库路径)
    const iZhiWei = lunar.Iziwei.fromLunar(currentLunar);
    const palaces = iZhiWei.getPalaces();

    // 5. 封装结果
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
      error: "紫微大脑运行异常", 
      detail: e.message 
    });
  }
};
