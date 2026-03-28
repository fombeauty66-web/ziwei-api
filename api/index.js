// 1. 放弃解构赋值，先拿到整个大库
const lunar = require('lunar-javascript');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date, school } = req.query;
    
    // 2. 补全日期格式
    let dateStr = date || '2026-03-28';
    if (dateStr.length <= 10) dateStr += ' 12:00:00';
    const finalDate = dateStr.replace('T', ' ').replace(/\+/g, ' ');
    
    // 3. 分步调用 (这是最稳的操作)
    const d = new Date(finalDate);
    const solar = lunar.Solar.fromDate(d);
    const currentLunar = solar.getLunar();

    // 4. 设置流派
    let sihuaType = 3; 
    if (school === 'zhongzhou') sihuaType = 1;
    if (school === 'quanshu') sihuaType = 0;
    
    // 核心修正：lunar-javascript 内部类的正确访问路径
    const ZiWeiSiHua = lunar.ZiWeiSiHua;
    if (ZiWeiSiHua) {
        ZiWeiSiHua.TYPE = sihuaType;
    }

    // 5. 排盘逻辑：改用更底层的 IZiWei (注意大小写)
    const IZiWei = lunar.IZiWei || lunar.Iziwei;
    const iZhiWei = IZiWei.fromLunar(currentLunar);
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
      error: "最终调试阶段报错", 
      detail: e.message,
      stack: e.stack.split('\n')[0] // 只看报错第一行，方便定位
    });
  }
};
