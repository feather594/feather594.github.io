(function () {
  'use strict';

  var STORAGE_KEY = 'mirage-language';
  var COURSE_PATHS = ['/24FallLAB1', '/26FallLAB2'];
  var root = document.documentElement;
  var normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
  var courseUnsupported = COURSE_PATHS.indexOf(normalizedPath) !== -1;
  var language = root.getAttribute('data-mirage-language') === 'en' ? 'en' : 'zh-CN';
  var observer = null;
  var ENGLISH_WORDS_PER_MINUTE = 200;

  // English copy is maintained here as: 'Chinese source text': 'English text'.
  // If the Chinese source changes, update both sides of the matching entry.
  var translations = {
    '首页': 'Home',
    '助教': 'Teaching',
    '24秋线性代数(B1)': 'Linear Algebra B1, Fall 2024',
    '26春实用随机过程': 'Applied Stochastic Processes, Spring 2026',
    '26秋线性代数(B2)': 'Linear Algebra B2, Fall 2026',
    '归档': 'Archives',
    '分类': 'Categories',
    '标签': 'Tags',
    '数学相关': 'Mathematics',
    '物理相关': 'Physics',
    '其他杂项': 'Miscellany',
    '关于': 'About',
    '链接': 'Links',
    '搜索': 'Search',
    '关键词': 'Keyword',
    '欢迎访问Mirage的个人主页！': "Welcome to Mirage's Homepage!",
    '落叶吹进深谷，歌声却没有归宿。——北岛': 'We are such stuff as dreams are made on. —— William Shakespeare',
    '总访问量': 'Total',
    '总访客数': 'Total',
    '阅读': '',
    '次': 'views',
    '人': 'visitors',
    '作者': 'Author',
    '发布于': 'Posted on',
    '更新于': 'Updated on',
    '许可协议': 'Licensed under',
    'BY - 署名': 'BY - Attribution',
    '上一篇': 'Previous',
    '下一篇': 'Next',
    '目录': 'Table of Contents',
    '页面不存在': 'Page Not Found',
    '你访问的页面可能已被移动、删除，或者地址错误。': 'The page you requested may have been moved, deleted, or the address may be incorrect.',
    '返回首页': 'Return Home',
    '返回上一页': 'Go Back',
    '如果浏览器不支持内嵌预览，可以': 'If your browser does not support embedded previews, you can',
    '在新标签页中打开PDF文件': ' open the PDF file in a new tab',
    '。': '.',

    '2026年春季学期 李代数及其表示理论作业': 'Homework for Lie Algebras and Their Representations, Spring 2026',
    '2026年春季学期 李代数及其表示理论': 'Lie Algebras and Their Representations, Spring 2026',
    '2026年春季学期 复分析(H)(英)作业': 'Homework for Complex Analysis(H)(EN), Spring 2026',
    '2026年春季学期 复分析(H)(英)': 'Complex Analysis(H)(EN), Spring 2026',
    '2026年春季学期 光学B作业': 'Homework for Optics B, Spring 2026',
    '2026年春季学期 光学B': 'Optics B, Spring 2026',
    '2026年春季学期 热学B作业': 'Homework for Thermotics B, Spring 2026',
    '2026年春季学期 热学B': 'Thermotics B, Spring 2026',
    '2026年春季学期 实用随机过程作业解答与习题课讲义': 'Solutions of Homework and Tutorial Notes for Applied Stochastic Processes, Spring 2026',
    '2026年春季学期 实用随机过程': 'Applied Stochastic Processes, Spring 2026',
    '2026年春季学期 同调代数讲义与作业': 'Lecture Notes and Homework for Homological Algebra, Spring 2026',
    '2026年春季学期 同调代数': 'Homological Algebra, Spring 2026',
    '2025年春季学期 朋辈助学活动讲义': 'Tutorial Notes for Peer-Assisted Study Program, Spring 2025',
    '2025年春季学期 朋辈助学活动': 'Peer-Assisted Study Program, Spring 2025',
    '这是一篇测试文章': 'This Is a Test Post',
    '数学公式、图片与PDF文档的显示测试。': 'A display test for mathematical formulas, images, and PDF documents.',

    '以下是2026年春季学期李代数及其表示理论课程作业的个人解答，该课程授课教师为陈洪佳老师。如发现错误或疏漏欢迎联系指正！': 'Below are my solutions to the homework for Lie Algebras and Their Representations in Spring 2026. The course was taught by Professor Chen Hongjia. Please contact me if you find any errors or omissions.',
    '以下是2026年春季学期复分析(H)(英)课程作业的个人解答，该课程授课教师为王兵老师。如发现错误或疏漏欢迎联系指正！': 'Below are my solutions to the homework for Complex Analysis(H)(EN) in Spring 2026. The course was taught in English by Professor Wang Bing. Please contact me if you find any errors or omissions.',
    '以下是2026年春季学期光学B课程作业的个人解答，该课程授课教师为周志远老师。如发现错误或疏漏欢迎联系指正！': 'Below are my solutions to the homework for Optics B in Spring 2026. The course was taught by Professor Zhou Zhiyuan. Please contact me if you find any errors or omissions.',
    '以下是2026年春季学期热学B课程作业的个人解答，该课程授课教师为吴许芬老师。如发现错误或疏漏欢迎联系指正！': 'Below are my solutions to the homework for Thermotics B in Spring 2026. The course was taught by Professor Wu Xufen. Please contact me if you find any errors or omissions.',
    '以下是2026年春季学期实用随机过程课程的作业解答与习题课讲义合集，该课程授课教师为冯群强老师，我于该学期担任该课程助教，由于本人该学期事情较多，课业也较为繁忙，故未搭建课程主页。该份文档是我与另一位助教共同编写，其中奇数周作业答案与期中习题课讲义由我编写。如发现错误或疏漏欢迎联系指正！': 'This document collects homework solutions and tutorial notes for Applied Stochastic Processes in Spring 2026. The course was taught by Professor Feng Qunqiang, and I served as a teaching assistant. Because I had a particularly busy semester, I did not build a separate course homepage. The document was co-authored with another teaching assistant; I wrote the solutions for odd-numbered weeks and the midterm tutorial notes. Please contact me if you find any errors or omissions.',
    '以下是2026年春季学期同调代数课程前半学期的讲义与四次作业的个人解答，该课程授课教师为胡海刚老师与王凯老师。因为我两次课均叠课无法到课，而老师发的手写讲义略显潦草与不清晰，于是我通过ChatGPT识别转换生成了该讲义的初稿，并且在学习该课程过程中对其进行修改与完善，让其成为了一份我觉得可读性还不错的讲义。如发现错误或疏漏欢迎联系指正！': 'This document contains lecture notes for the first half of Homological Algebra in Spring 2026 and my solutions to four homework assignments. The course was taught by Professors Hu Haigang and Wang Kai. Since both weekly meetings conflicted with other courses and the handwritten notes were difficult to read, I used ChatGPT to transcribe an initial draft, then revised and expanded it while studying the course. The result is a set of notes that I find reasonably readable. Please contact me if you find any errors or omissions.',
    '以下是2025年春季学期朋辈助学活动讲义，授课内容是数学分析(B2)。该份文档是我与': 'Below are the lecture notes for the Spring 2025 peer-assisted study program, covering Mathematical Analysis(B2). This document was co-authored by',
    '张积翔': ' Zhang Jixiang ',
    '同学共同编写。如发现错误或疏漏欢迎联系指正！': 'and me. Please contact us if you find any errors or omissions.',

    '数学公式测试': 'Mathematical Formula Test',
    '行内公式：': 'Inline formula: ',
    '，以及高斯积分': ', together with the Gaussian integral ',
    '行间公式：': 'Displayed formula: ',
    '图片显示测试': 'Image Display Test',
    '本地图片显示测试': 'Local image display test',
    'PDF显示测试': 'PDF Display Test',

    '关于我：': 'About Me:',
    '欢迎访问我的个人主页，本人目前是中国科学技术大学2023级数学与应用数学专业基础数学方向的一名学生。': 'Welcome to my personal homepage. I am a member of the 2023 cohort at the University of Science and Technology of China, majoring in Mathematics and Applied Mathematics with a focus on Pure Mathematics.',
    '我目前感兴趣的方向是代数。': 'My current area of interest is algebra.',
    '教育经历：': 'Education:',
    '2025年5月-至今：本科，中国科学技术大学，数学科学学院，数学与应用数学专业，基础数学方向，并于2025年9月加入华罗庚数学科技英才班。': 'May 2025–Present: Undergraduate, School of Mathematical Sciences, University of Science and Technology of China; Mathematics and Applied Mathematics, Pure Mathematics track. Joined the Hua Loo-Keng Talent Program in Mathematics in September 2025.',
    '在大三秋季学期修读多门统计专业课后发觉自己并不喜欢统计，而是对纯数学更感兴趣，于是在大三春季学期拟降转至2023级数学科学学院。': 'After taking several statistics courses in the fall semester of my junior year, I realized that statistics was not the field I wanted to pursue and that I was more interested in pure mathematics. I therefore planned to transfer into the 2023 cohort of the School of Mathematical Sciences in the following spring semester.',
    '2022年8月-2025年1月: 本科，中国科学技术大学，管理学院，统计学专业。': 'August 2022–January 2025: Undergraduate, School of Management, University of Science and Technology of China; Statistics.',
    '所修课程：': 'Coursework:',
    '以下是我在中国科学技术大学本科阶段所修读过的部分课程列表，包含数学类课程与计算机类课程，格式为：“课程名称 (学分)(成绩)(备注(如有))”，以及带"*"表明这是研究生课。': 'Below is a selection of courses I have taken as an undergraduate at the University of Science and Technology of China. Entries follow the format “Course (Credits) (Grade) (Notes, if any),” and an asterisk indicates a graduate-level course.',
    '数学类课程：': 'Mathematics Courses:',
    '分析与方程：': 'Analysis and Equations:',
    '数学分析(B1) (6)(85)': 'Mathematical Analysis B1 (6)(85)',
    '数学分析(B2) (6)(88)': 'Mathematical Analysis B2 (6)(88)',
    '数学分析(B3) (4)(96)': 'Mathematical Analysis B3 (4)(96)',
    '微分方程概论 (4)(86)(主要内容为ODE)': 'Introduction to Differential Equations with Applications (4)(86)(primarily ODEs)',
    '偏微分方程 (3)(83)': 'Partial Differential Equations (3)(83)',
    '实分析 (3)(95)': 'Real Analysis (3)(95)',
    '实分析(H) (4)(95)': 'Real Analysis(H) (4)(95)',
    '复分析 (3)(85)': 'Complex Variable (3)(85)',
    '复分析(H)(英) (4)(85)': 'Complex Analysis(H)(EN) (4)(85)',
    '泛函分析 (3)(97)': 'Functional Analysis (3)(97)',
    '*遍历理论初步 (4)(86)': '*An Introduction to Ergodic Theory (4)(86)',
    '*高等实分析 (4)(OG)': '*Advanced Real Analysis (4)(OG)',
    '*调和分析 (4)(OG)': '*Harmonic Analysis (4)(OG)',
    '*高等泛函分析 (4)(OG)': '*Functional Analysis II (4)(OG)',
    '代数与数论：': 'Algebra and Number Theory:',
    '代数学基础 (2)(93)': 'Foundations of Algebra (2)(93)',
    '线性代数(B1) (4)(95)': 'Linear Algebra B1 (4)(95)',
    '线性代数(B2) (5)(95)': 'Linear Algebra B2 (5)(95)',
    '近世代数(H) (4)(81)': 'Modern Algebra(H) (4)(81)',
    '*交换代数 (4)(85)': '*Commutative Algebra (4)(85)',
    '*同调代数 (4)(89)': '*Homological Algebra (4)(89)',
    '*李代数及其表示理论 (4)(92)': '*Lie Algebras and Their Representations (4)(92)',
    '*代数数论 (4)(81)': '*Algebraic Number Theory (4)(81)',
    '*代数几何初步 (4)(OG)': '*Introduction to Algebraic Geometry (4)(OG)',
    '*无限维李代数 (4)(OG)': '*Infinite Dimensional Lie Algebras (4)(OG)',
    '*代数学选讲 (4)(OG)': '*Topics in Algebra (4)(OG)',
    '*代数几何进阶 (4)(OG)': '*Advanced Algebraic Geometry (4)(OG)',
    '华罗庚讨论班(H) (4)(99)(报告内容是代数相关)': 'L.-K. Hua Seminar(H) (4)(99)(presentation on a topic in algebra)',
    '几何与拓扑：': 'Geometry and Topology:',
    '几何学基础 (2)(86)': 'Foundations of Geometry (2)(86)',
    '拓扑学 (3)(89)': 'Topology (3)(89)',
    '拓扑学(H)(英) (4)(OG)': 'Topology(H)(EN) (4)(OG)',
    '微分几何(H) (4)(90)': 'Differential Geometry(H) (4)(90)',
    '*微分流形 (4)(OG)': '*Differential Manifolds (4)(OG)',
    '*代数拓扑 (4)(OG)': '*Algebraic Topology (4)(OG)',
    '*黎曼几何 (4)(OG)': '*Riemannian Geometry (4)(OG)',
    '概率与统计：': 'Probability and Statistics:',
    '概率论 (4)(90)(管理学院开课)': 'Probability (4)(90)(offered by the School of Management)',
    '概率论进阶 (1)(85)': 'Probability Theory-Outer Chapter (1)(85)',
    '数理统计 (4)(87)(管理学院开课)': 'Mathematical Statistics (4)(87)(offered by the School of Management)',
    '实用随机过程 (4)(98)': 'Applied Stochastic Processes (4)(98)',
    '回归分析 (3.5)(95)(管理学院开课)': 'Regression Analysis (3.5)(95)(offered by the School of Management)',
    '时间序列分析A (3.5)(93)': 'Time Series Analysis A (3.5)(93)',
    '*高等概率论 (4)(92)': '*Advanced Probability Theory (4)(92)',
    '*随机过程 (4)(OG)': '*Stochastic Processes (4)(OG)',
    '*极限理论 (3)(OG)': '*Limit Theory (3)(OG)',
    '计算机类课程：': 'Computer Science Courses:',
    '计算机程序设计A (4)(97)': 'Computer Programming A (4)(97)',
    '实用统计软件 (3)(95)(主要内容为R语言)': 'Applied Statistical Software (3)(95)(primarily R)',
    '统计算法基础 (2)(90)': 'Fundamentals of Statistical Algorithms (2)(90)',
    'Matlab编程及其应用 (1.5)(通过)(二等级制课程)': 'Matlab Programming and Application (1.5)(Pass)(graded on a pass/fail basis)',
    '兴趣爱好：': 'Interests:',
    '跑步（巅峰时期三公里配速3分50，已经回不去力）、游泳等': 'Running (my best 3 km pace was 3:50 per kilometre, though those days are gone), swimming, and more.',
    '炉石传说玩家、Steam等级40（doge）': 'Hearthstone player and Steam level 40 (doge).',
    '曾获荣誉：': 'Honors and Awards:',
    '2025/12 全国大学生数学竞赛安徽省数学组二等奖': '2025/12 Chinese College Mathematics Competitions (Anhui Province), 2nd Prize, Mathematics Category',
    '2025/09 优秀学生奖学金银奖': '2025/09 Outstanding Student Scholarship, Silver Award',
    '2024/12 全国大学生数学竞赛安徽省非数组二等奖': '2024/12 Chinese College Mathematics Competitions (Anhui Province), 2nd Prize, Non-Mathematics Category',
    '2024/09 国家奖学金': '2024/09 National Scholarship',
    '2024/04 “九章杯”大学生数学竞赛非数组三等奖': '2024/04 Jiuzhang Cup College Mathematics Competition, 3rd Prize, Non-Mathematics Category',
    '2023/10 奋进奖学金': '2023/10 Endeavor Scholarship',
    '我来问道无馀说，云在青霄水在瓶': 'What we call the beginning is often the end, and to make an end is to make a beginning.',

    '主题博客': 'Theme Blog',
    '主题使用指南': 'Theme Documentation',
    '主题GitHub仓库': 'Theme GitHub Repository',
    '个人主页': 'Personal Homepage',
    '评课社区': 'iCourse Club',
    '我的评课社区主页': 'My Profile on iCourse Club'
  };

  function translatePattern(value) {
    var match = value.match(/^共计\s+(\d+)\s+篇文章$/);
    if (match) return match[1] + (match[1] === '1' ? ' post in total' : ' posts in total');

    match = value.match(/^标签\s*-\s*(数学相关|物理相关|其他杂项)$/);
    if (match) return 'Tags - ' + translations[match[1]];

    match = value.match(/^(\d+)\s*字$/);
    if (match) return match[1] + (match[1] === '1' ? ' word' : ' words');

    match = value.match(/^(\d+)\s*分钟$/);
    if (match) return match[1] + (match[1] === '1' ? ' min' : ' mins');

    match = value.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*(上午|下午))?$/);
    if (match) {
      var months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return months[Number(match[2]) - 1] + ' ' + Number(match[3]) + ', ' + match[1] +
        (match[4] ? (match[4] === '上午' ? ' AM' : ' PM') : '');
    }

    return null;
  }

  function translateValue(value) {
    if (Object.prototype.hasOwnProperty.call(translations, value)) {
      return translations[value];
    }
    return translatePattern(value);
  }

  function isSkippedNode(node) {
    var parent = node.parentElement;
    if (!parent) return true;
    return !!parent.closest('script, style, noscript, code, pre, kbd, samp, svg, .katex, .MathJax');
  }

  function translateTextNode(node) {
    if (!node || isSkippedNode(node)) return;

    var raw = node.nodeValue;
    var trimmed = raw.trim();
    if (!trimmed) return;

    var translated = translateValue(trimmed);
    if (translated === null || translated === undefined) return;

    var leading = (raw.match(/^\s*/) || [''])[0];
    var trailing = (raw.match(/\s*$/) || [''])[0];
    node.nodeValue = leading + translated + trailing;
  }

  function translateTree(target) {
    if (!target) return;
    if (target.nodeType === Node.TEXT_NODE) {
      translateTextNode(target);
      return;
    }

    var walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    var current;
    while ((current = walker.nextNode())) {
      translateTextNode(current);
    }
  }

  function translateAttributes(target) {
    if (!target || !target.querySelectorAll) return;

    var elements = target.matches && target.matches('[title], [alt], [placeholder], [aria-label], [data-typed-text]')
      ? [target]
      : [];
    elements = elements.concat(Array.prototype.slice.call(
      target.querySelectorAll('[title], [alt], [placeholder], [aria-label], [data-typed-text]')
    ));

    elements.forEach(function (element) {
      ['title', 'alt', 'placeholder', 'aria-label', 'data-typed-text'].forEach(function (attribute) {
        if (!element.hasAttribute(attribute)) return;
        var current = element.getAttribute(attribute).trim();
        var translated = translateValue(current);

        if (translated !== null && translated !== undefined) {
          element.setAttribute(attribute, translated);
          return;
        }

        if (/ PDF预览$/.test(current)) {
          element.setAttribute(attribute, current.replace(/ PDF预览$/, ' PDF Preview'));
        } else if (/预览$/.test(current)) {
          element.setAttribute(attribute, current.replace(/预览$/, ' Preview'));
        }
      });
    });
  }

  function translateDocumentTitle() {
    document.title = document.title.split(' - ').map(function (part) {
      var translated = translateValue(part.trim());
      return translated === null || translated === undefined ? part : translated;
    }).join(' - ');

    document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach(function (meta) {
      var value = meta.getAttribute('content') || '';
      var translated = translateValue(value.trim());
      if (translated !== null && translated !== undefined) {
        meta.setAttribute('content', translated);
      }
    });
  }

  function updateEnglishPostStats() {
    if (language !== 'en') return;

    var content = document.querySelector('.post-content .markdown-body');
    var wordCountValue = document.querySelector('.mirage-post-wordcount__value');
    if (!content || !wordCountValue) return;

    var textParts = [];
    var walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    var current;

    while ((current = walker.nextNode())) {
      if (!isSkippedNode(current)) {
        textParts.push(current.nodeValue);
      }
    }

    var words = textParts.join(' ').match(/[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*/g) || [];
    var wordCount = words.length;
    wordCountValue.textContent = wordCount + (wordCount === 1 ? ' word' : ' words');

    var readingTimeValue = document.querySelector('.mirage-post-reading-time__value');
    if (readingTimeValue) {
      var minutes = Math.max(1, Math.ceil(wordCount / ENGLISH_WORDS_PER_MINUTE));
      readingTimeValue.textContent = minutes + (minutes === 1 ? ' min' : ' mins');
    }
  }

  function updateToggle() {
    var button = document.querySelector('#language-toggle-btn .nav-link');
    var label = document.querySelector('#language-toggle-btn .mirage-language-label');
    if (!button || !label) return;

    label.textContent = language === 'en' ? '中' : 'EN';
    button.setAttribute('aria-label', language === 'en' ? 'Switch to Chinese' : '切换为英文');
    button.setAttribute('title', language === 'en' ? 'Switch to Chinese' : '切换为英文');
  }

  function createToast() {
    var toast = document.getElementById('mirage-language-toast');
    if (toast) return toast;

    toast = document.createElement('div');
    toast.id = 'mirage-language-toast';
    toast.className = 'mirage-language-toast';
    toast.setAttribute('role', 'alertdialog');
    toast.setAttribute('aria-modal', 'true');
    toast.setAttribute('aria-labelledby', 'mirage-language-toast-title');
    toast.setAttribute('aria-describedby', 'mirage-language-toast-description');
    toast.innerHTML =
      '<span class="mirage-comment-alert__mark" aria-hidden="true">!</span>' +
      '<strong id="mirage-language-toast-title">本页面暂不支持该语言</strong>' +
      '<span id="mirage-language-toast-description" class="mirage-language-toast__english">' +
        'This page is not yet available in this language.' +
      '</span>' +
      '<button class="mirage-comment-alert__confirm mirage-language-toast__confirm" type="button">确定</button>';
    document.body.appendChild(toast);

    toast.querySelector('.mirage-language-toast__confirm').addEventListener('click', hideUnsupportedToast);
    return toast;
  }

  function handleUnsupportedToastKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault();
      hideUnsupportedToast();
    }
  }

  function hideUnsupportedToast() {
    var toast = document.getElementById('mirage-language-toast');
    if (!toast) return;

    document.removeEventListener('keydown', handleUnsupportedToastKeydown);
    toast.classList.remove('is-visible');
  }

  function showUnsupportedToast() {
    var toast = createToast();
    toast.classList.remove('is-visible');
    document.removeEventListener('keydown', handleUnsupportedToastKeydown);
    document.addEventListener('keydown', handleUnsupportedToastKeydown);
    window.requestAnimationFrame(function () {
      toast.classList.add('is-visible');
      toast.querySelector('.mirage-language-toast__confirm').focus();
    });
  }

  function saveLanguage(nextLanguage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch (error) {
      return false;
    }
    return true;
  }

  function handleToggle(event) {
    event.preventDefault();

    if (courseUnsupported) {
      showUnsupportedToast();
      return;
    }

    var nextLanguage = language === 'en' ? 'zh-CN' : 'en';
    saveLanguage(nextLanguage);
    root.classList.add('mirage-language-leaving');
    window.setTimeout(function () {
      window.location.reload();
    }, 170);
  }

  function observeDynamicContent() {
    if (!document.body || observer) return;

    observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === 'characterData') {
          translateTextNode(record.target);
          return;
        }
        record.addedNodes.forEach(function (node) {
          translateTree(node);
          if (node.nodeType === Node.ELEMENT_NODE) {
            translateAttributes(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function init() {
    var toggle = document.querySelector('#language-toggle-btn .nav-link');
    if (toggle) toggle.addEventListener('click', handleToggle);

    if (!courseUnsupported && language === 'en') {
      translateTree(document.body);
      translateAttributes(document.body);
      translateDocumentTitle();
      updateEnglishPostStats();
      observeDynamicContent();
    }

    updateToggle();
    root.classList.add('mirage-i18n-ready');

    if (courseUnsupported &&
        root.getAttribute('data-mirage-language-preference') === 'en') {
      window.setTimeout(showUnsupportedToast, 420);
    }
  }

  if (!courseUnsupported && language === 'en' && document.body) {
    translateTree(document.body);
    translateAttributes(document.body);
    translateDocumentTitle();
    updateEnglishPostStats();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
