// 1. 三重保险加载：尝试直接从库的根路径或其子路径加载
let lunar;
try {
    lunar = require('lunar-typescript');
    if (Object.keys(lunar).length === 0) {
        // 如果根路径是空的，尝试加载它的子路径（针对某些构建版本的 Vercel 优化）
        lunar = require('lunar-typescript/dist/lunar.common.js');
    }
} catch (e) {
    lunar = require('lunar-typescript');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { date, school } = req.query;
    let dateStr = date || '2026-03-28 12:00:00';
    const finalDate = dateStr.replace('T', ' ').replace(/\+/g, ' ');
    
    // 2. 历法计算：不再解构，直接从大对象里翻
    const solar = (lunar.Solar || lunar.default.Solar).fromDate(new Date(finalDate));
    const lunarDate = solar.getLunar();

    // 3. 寻找紫微引擎 (尝试所有可能的路径)
    const Engine = lunar.Iziwei || (lunar.default && lunar.default.Iziwei) || lunar.IZiWei;
    
    if (!Engine) {
      throw new Error("引擎在所有已知路径中均未找到");
    }

    const iZhiWei = Engine.fromLunar(lunarDate);
    const palaces = iZhiWei.getPalaces();

    const result = {
      info: {
        bazi: lunarDate.getEightChar().toString(),
        wuxing: iZhiWei.getWuXing(),
        solarDate: solar.toFullString()
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
      error: "环境探测失败", 
      detail: e.message,
      // 这一行能彻底帮我分析出 Vercel 里的导出结构
      env_debug: {
        has_default: !!lunar.default,
        root_keys: Object.keys(lunar),
        default_keys: lunar.default ? Object.keys(lunar.default) : []
      }
    });
  }
};
