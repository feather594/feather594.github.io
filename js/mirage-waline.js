(function () {
  'use strict';
  var host = document.getElementById('mirage-waline');
  if (!host || host.dataset.initialized) return;
  host.dataset.initialized = 'true';
  var root = document.documentElement;
  var english = root.getAttribute('data-mirage-language') === 'en';
  var text = english ? {
    idle: 'Comments will load when you scroll here.', loading: 'Loading comments…',
    unavailable: 'Comments are temporarily unavailable. Please try again later.',
    retry: 'Retry', nickname: 'Nickname', email: 'Email (optional)',
    content: 'Content (comments will be displayed after administrator approval)',
    emptyContent: 'Content is required', emptyNickname: 'Nickname is required',
    invalidEmail: 'Please enter a valid email address', confirm: 'OK', submit: 'Send',
    review: 'Your comment has been submitted and is awaiting administrator approval.'
  } : {
    idle: '滚动到此处后加载评论。', loading: '正在加载评论…',
    unavailable: '评论暂时无法加载，请稍后重试。', retry: '重试',
    nickname: '昵称', email: '邮件地址（可选）',
    content: '内容（评论经管理员审核通过后方可展示）',
    emptyContent: '内容不能为空', emptyNickname: '昵称不能为空',
    invalidEmail: '请输入有效的邮件地址', confirm: '确定', submit: '发送',
    review: '评论已提交，审核通过后方可展示。'
  };
  var status = host.querySelector('.mirage-waline-status');
  var retry = host.querySelector('.mirage-waline-retry');
  var mount = host.querySelector('.mirage-waline-mount');
  var started = false;
  var instance = null;
  var observer;
  var stylePromise;
  var nextEditor = 0;
  var activeDismiss;
  status.textContent = text.idle;
  retry.textContent = text.retry;

  function showAlert(message, returnFocus) {
    if (activeDismiss) activeDismiss();
    var previous = returnFocus || document.activeElement;
    var modal = document.createElement('div');
    modal.id = 'mirage-comment-alert';
    modal.className = 'mirage-comment-alert';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'mirage-comment-alert-message');
    var panel = document.createElement('div');
    panel.className = 'mirage-comment-alert__panel';
    var mark = document.createElement('span');
    mark.className = 'mirage-comment-alert__mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '!';
    var messageNode = document.createElement('p');
    messageNode.id = 'mirage-comment-alert-message';
    messageNode.className = 'mirage-comment-alert__message';
    messageNode.textContent = String(message);
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'mirage-comment-alert__confirm';
    button.textContent = text.confirm;
    panel.append(mark, messageNode, button);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    function dismiss() {
      document.removeEventListener('keydown', keydown, true);
      modal.remove();
      activeDismiss = null;
      if (previous && previous.isConnected) previous.focus();
    }
    function keydown(event) {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        event.stopImmediatePropagation();
        dismiss();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        button.focus();
      }
    }
    button.addEventListener('click', dismiss);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) dismiss();
    });
    document.addEventListener('keydown', keydown, true);
    activeDismiss = dismiss;
    requestAnimationFrame(function () {
      if (modal.isConnected) { modal.classList.add('is-visible'); button.focus(); }
    });
  }

  // Validate before Waline's click / Ctrl+Enter handlers, including reply editors.
  function validate(event) {
    var trigger = event.type === 'click'
      ? event.target.closest('.wl-comment .wl-btn.primary')
      : (event.target.matches('textarea.wl-editor') &&
        (event.ctrlKey || event.metaKey) && event.key === 'Enter' ? event.target : null);
    if (!trigger || trigger.disabled) return;
    var box = trigger.closest('.wl-comment');
    var editor = box.querySelector('textarea.wl-editor');
    var nick = box.querySelector('input[name="nick"]');
    var mail = box.querySelector('input[name="mail"]');
    var field, message;
    if (editor && !editor.value.trim()) { field = editor; message = text.emptyContent; }
    else if (nick && utf8Length(nick.value.trim()) < 3) { field = nick; message = text.emptyNickname; }
    else if (mail && mail.value && !mail.validity.valid) { field = mail; message = text.invalidEmail; }
    if (message) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showAlert(message, field);
    }
  }
  host.addEventListener('click', validate, true);
  host.addEventListener('keydown', validate, true);

  function utf8Length(value) {
    if (window.TextEncoder) return new TextEncoder().encode(value).length;
    return unescape(encodeURIComponent(value)).length;
  }

  function adaptEditors() {
    host.querySelectorAll('.wl-comment').forEach(function (box) {
      if (!box.dataset.mirageEditor) box.dataset.mirageEditor = String(++nextEditor);
      var key = box.dataset.mirageEditor;
      ['nick', 'mail'].forEach(function (kind) {
        var input = box.querySelector('input[name="' + kind + '"]');
        if (!input) return;
        var label = input.parentElement.querySelector('label');
        var id = 'mirage-waline-' + key + '-' + kind;
        input.id = id;
        input.autocomplete = kind === 'mail' ? 'email' : 'nickname';
        if (label) {
          label.htmlFor = id;
          var value = kind === 'mail' ? text.email : text.nickname;
          if (label.textContent !== value) label.textContent = value;
        }
      });
      var editor = box.querySelector('textarea.wl-editor');
      if (!editor) return;
      editor.id = 'mirage-waline-' + key + '-content';
      editor.setAttribute('aria-label', text.content);
      var label = box.querySelector('.mirage-waline-content-label');
      if (!label) {
        label = document.createElement('label');
        label.className = 'mirage-waline-content-label';
        label.textContent = text.content;
        editor.before(label);
      }
      label.htmlFor = editor.id;
    });

    host.querySelectorAll('.wl-card-item').forEach(function (item) {
      var userColumn = Array.prototype.find.call(item.children, function (child) {
        return child.classList.contains('wl-user');
      });
      var card = Array.prototype.find.call(item.children, function (child) {
        return child.classList.contains('wl-card');
      });
      if (!userColumn || !card || !userColumn.querySelector('.administrator-icon')) return;
      var head = Array.prototype.find.call(card.children, function (child) {
        return child.classList.contains('wl-head');
      });
      if (!head || head.querySelector('.mirage-waline-admin-badge')) return;
      var badge = document.createElement('span');
      badge.className = 'wl-badge mirage-waline-admin-badge';
      badge.textContent = english ? 'ADMIN' : '管理员';
      var nick = head.querySelector('.wl-nick');
      if (nick) nick.insertAdjacentElement('afterend', badge);
      else head.prepend(badge);
    });
  }

  function loadStyles() {
    if (stylePromise) return stylePromise;
    stylePromise = new Promise(function (resolve, reject) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = host.dataset.styleUrl;
      link.onload = resolve;
      link.onerror = function () { link.remove(); stylePromise = null; reject(new Error('style')); };
      document.head.appendChild(link);
    });
    return stylePromise;
  }

  async function load() {
    if (started) return;
    started = true;
    if (observer) observer.disconnect();
    retry.hidden = true;
    status.hidden = false;
    status.textContent = text.loading;
    host.setAttribute('aria-busy', 'true');
    try {
      var serverURL = host.dataset.serverUrl;
      if (!serverURL) throw new Error('Waline server is not configured');
      var results = await Promise.all([import(host.dataset.clientUrl), loadStyles()]);
      instance = results[0].init({
        el: mount, serverURL: serverURL, path: host.dataset.pagePath,
        lang: english ? 'en-US' : 'zh-CN',
        dark: 'html[data-user-color-scheme="dark"]',
        meta: ['nick', 'mail'], requiredMeta: ['nick'], login: 'disable',
        emoji: false, search: false, imageUploader: false,
        highlighter: false, texRenderer: false, reaction: false,
        pageview: false, comment: false, noRss: true,
        pageSize: 10, commentSorting: 'oldest',
        locale: {
          nick: text.nickname, mail: english ? 'Email' : '邮件地址',
          placeholder: '', submit: text.submit,
          nickError: text.emptyNickname, mailError: text.invalidEmail,
          commentUnderReview: text.review
        }
      });
      var editorObserver = new MutationObserver(adaptEditors);
      editorObserver.observe(mount, { childList: true, subtree: true });
      adaptEditors();
      status.hidden = true;
      host.classList.add('is-loaded');
    } catch (error) {
      if (instance) { instance.destroy(); instance = null; }
      started = false;
      status.textContent = text.unavailable;
      retry.hidden = false;
      console.warn('Waline could not be initialized:', error);
    } finally { host.removeAttribute('aria-busy'); }
  }
  retry.addEventListener('click', load);
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) load();
    }, { rootMargin: '300px 0px', threshold: 0 });
    observer.observe(host);
  } else {
    function checkPosition() {
      var rect = host.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 300 && rect.bottom >= -300) {
        window.removeEventListener('scroll', checkPosition);
        window.removeEventListener('resize', checkPosition);
        load();
      }
    }
    window.addEventListener('scroll', checkPosition, { passive: true });
    window.addEventListener('resize', checkPosition, { passive: true });
    checkPosition();
  }
}());
