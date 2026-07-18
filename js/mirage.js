(function () {
  'use strict';

  function initAutoHideNavbar() {
    var navbar = document.getElementById('navbar');
    var lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    var direction = 0;
    var travel = 0;
    var scrollQueued = false;
    var hideTimer = 0;
    var pointerReveal = false;
    var revealZone = 24;
    var topThreshold = 72;
    var travelThreshold = 22;
    var leaveDelay = 120;

    if (!navbar) return;

    function currentScrollY() {
      return Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0);
    }

    function clearHideTimer() {
      if (!hideTimer) return;
      window.clearTimeout(hideTimer);
      hideTimer = 0;
    }

    function showNavbar(source) {
      clearHideTimer();
      if (source === 'pointer') {
        pointerReveal = true;
      } else if (source === 'scroll' || source === 'focus') {
        pointerReveal = false;
      }
      navbar.classList.remove('mirage-navbar-hidden');
    }

    function navigationIsOpen() {
      return !!(navbar.classList.contains('navbar-col-show') ||
        navbar.querySelector('.dropdown-menu.show, .navbar-collapse.show') ||
        navbar.matches(':focus-within'));
    }

    function hideNavbar() {
      clearHideTimer();
      if (currentScrollY() <= topThreshold) {
        showNavbar('scroll');
        return;
      }
      if (navigationIsOpen()) {
        showNavbar();
        return;
      }
      pointerReveal = false;
      navbar.classList.add('mirage-navbar-hidden');
    }

    function pointerIsInNavbarZone(event) {
      var rect = navbar.getBoundingClientRect();
      var expectedLeft = (window.innerWidth - navbar.offsetWidth) / 2 - 14;
      var expectedRight = expectedLeft + navbar.offsetWidth + 28;
      var expectedBottom = Math.max(rect.bottom + 14, navbar.offsetHeight + 32);

      return navbar.contains(event.target) ||
        (
          event.clientY >= 0 &&
          event.clientY <= expectedBottom &&
          event.clientX >= expectedLeft &&
          event.clientX <= expectedRight
        );
    }

    function schedulePointerHide() {
      if (!pointerReveal || currentScrollY() <= topThreshold || hideTimer) return;
      hideTimer = window.setTimeout(function () {
        hideTimer = 0;
        hideNavbar();
      }, leaveDelay);
    }

    function updateFromScroll() {
      var scrollY = currentScrollY();
      var delta = scrollY - lastScrollY;
      var nextDirection = delta > 0 ? 1 : (delta < 0 ? -1 : 0);

      scrollQueued = false;
      if (scrollY <= topThreshold) {
        showNavbar('scroll');
        direction = 0;
        travel = 0;
      } else if (nextDirection !== 0) {
        if (nextDirection !== direction) {
          direction = nextDirection;
          travel = Math.abs(delta);
        } else {
          travel += Math.abs(delta);
        }

        if (travel >= travelThreshold) {
          if (direction > 0) {
            hideNavbar();
          } else {
            showNavbar('scroll');
          }
          travel = 0;
        }
      }

      lastScrollY = scrollY;
    }

    window.addEventListener('scroll', function () {
      if (scrollQueued) return;
      scrollQueued = true;
      window.requestAnimationFrame(updateFromScroll);
    }, { passive: true });

    window.addEventListener('pointermove', function (event) {
      if (event.clientY <= revealZone) {
        showNavbar('pointer');
      } else if (pointerReveal) {
        if (pointerIsInNavbarZone(event)) {
          clearHideTimer();
        } else {
          schedulePointerHide();
        }
      }
    }, { passive: true });

    window.addEventListener('pointerout', function (event) {
      if (!event.relatedTarget) {
        schedulePointerHide();
      }
    }, { passive: true });

    navbar.addEventListener('pointerenter', function () {
      if (currentScrollY() > topThreshold) {
        showNavbar('pointer');
      } else {
        showNavbar('scroll');
      }
    }, { passive: true });
    navbar.addEventListener('pointerleave', schedulePointerHide, { passive: true });
    navbar.addEventListener('focusin', function () {
      showNavbar('focus');
    });
    navbar.addEventListener('click', function () {
      showNavbar();
    });

    if (lastScrollY > topThreshold) {
      hideNavbar();
    } else {
      showNavbar('scroll');
    }
  }

  function initGutterNetwork(reduceMotion) {
    var board = document.getElementById('board-ctn') || document.getElementById('board');
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var minViewport = 280;
    var minFieldWidth = 280;
    var topOverlap = 24;
    var disturbanceRadius = 210;
    var cruiseSpeedMin = 0.022;
    var cruiseSpeedMax = 0.046;
    var maximumSpeed = 0.145;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var palette = {
      blue: [26, 154, 235],
      cyan: [36, 190, 223],
      violet: [103, 75, 232],
      amber: [232, 151, 40]
    };
    var seed = 20260717;
    var layoutQueued = false;
    var animationFrame = 0;
    var lastFrame = performance.now();
    var sides;

    if (!board || !document.body) return;

    function random() {
      seed += 0x6D2B79F5;
      var value = seed;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    }

    function rgba(color, alpha) {
      return 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + alpha + ')';
    }

    function desiredNodeCount(side) {
      var visibleHeight = Math.max(0, side.height - side.topLimit);
      var visibleArea = side.width * visibleHeight;
      return Math.max(8, Math.min(240, Math.round(visibleArea / 10000)));
    }

    function makeNode(side, index) {
      var minimumY = side.topLimit + 14;
      var availableHeight = Math.max(24, side.height - minimumY - 14);
      var angle = random() * Math.PI * 2;
      var speed = cruiseSpeedMin + random() * (cruiseSpeedMax - cruiseSpeedMin);

      return {
        x: 12 + random() * Math.max(24, side.width - 24),
        y: minimumY + random() * availableHeight,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        cruiseSpeed: speed,
        radius: index % 12 === 0 ? 2.8 : 1.15 + random() * 1.25,
        phase: random() * Math.PI * 2,
        turnRate: (0.00034 + random() * 0.00036) * (random() > 0.5 ? 1 : -1),
        color: index % 12 === 0
          ? palette.amber
          : (index % 3 === 0 ? palette.violet : palette.blue)
      };
    }

    function seedNodes(side) {
      var count = desiredNodeCount(side);
      var nodes = [];
      var index;

      for (index = 0; index < count; index += 1) {
        nodes.push(makeNode(side, index));
      }

      side.nodes = nodes;
    }

    function syncNodeCount(side) {
      var targetCount = desiredNodeCount(side);

      while (side.nodes.length < targetCount) {
        side.nodes.push(makeNode(side, side.nodes.length));
      }

      if (side.nodes.length > targetCount) {
        side.nodes.splice(targetCount);
      }
    }

    function makeSide(name) {
      var canvas = document.createElement('canvas');
      canvas.className = 'mirage-gutter-canvas mirage-gutter-canvas--' + name;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.setAttribute('role', 'presentation');
      document.body.appendChild(canvas);

      return {
        name: name,
        canvas: canvas,
        context: canvas.getContext('2d'),
        nodes: [],
        pulses: [],
        pointer: {
          x: 0,
          y: 0,
          active: false,
          speed: 0,
          velocityX: 0,
          velocityY: 0,
          lastX: 0,
          lastY: 0,
          lastMove: 0
        },
        left: 0,
        width: 0,
        height: 0,
        topLimit: 0,
        visible: false
      };
    }

    sides = [makeSide('field')];

    function resizeBitmap(side, width, height) {
      if (side.width === width && side.height === height) return;

      side.width = width;
      side.height = height;
      side.canvas.style.width = width + 'px';
      side.canvas.style.height = height + 'px';
      side.canvas.width = Math.max(1, Math.round(width * dpr));
      side.canvas.height = Math.max(1, Math.round(height * dpr));
      side.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function updateLayout() {
      var viewportWidth = window.innerWidth;
      var viewportHeight = window.innerHeight;
      var header = document.querySelector('body > header');
      var headerInner = document.querySelector('.header-inner');
      var banner = document.getElementById('banner');
      var headerRect = header ? header.getBoundingClientRect() : null;
      var headerInnerRect = headerInner ? headerInner.getBoundingClientRect() : null;
      var bannerRect = banner ? banner.getBoundingClientRect() : null;
      var enabled = viewportWidth >= minViewport;
      var fieldWidth = enabled ? viewportWidth : 0;
      var darkRegionBottom = bannerRect
        ? bannerRect.bottom
        : Math.max(
          headerRect ? headerRect.bottom : 0,
          headerInnerRect ? headerInnerRect.bottom : 0
        );
      var topLimit = Math.max(
        0,
        Math.min(viewportHeight, Math.ceil(darkRegionBottom) - topOverlap)
      );

      dpr = Math.min(window.devicePixelRatio || 1, 2);

      sides.forEach(function (side) {
        var width = fieldWidth;
        var previousWidth = side.width;
        var previousHeight = side.height;
        var previousTopLimit = side.topLimit;
        side.left = 0;
        side.canvas.style.left = side.left + 'px';
        side.canvas.style.clipPath = 'inset(' + topLimit + 'px 0 0 0)';
        side.canvas.style.webkitClipPath = 'inset(' + topLimit + 'px 0 0 0)';
        side.topLimit = topLimit;
        side.visible = width >= minFieldWidth && topLimit < viewportHeight - 52;
        side.canvas.classList.toggle('is-visible', side.visible);
        resizeBitmap(side, width, viewportHeight);

        if (!side.visible && width === 0) {
          side.nodes = [];
        }

        if (side.visible && !side.nodes.length) {
          seedNodes(side);
        } else if (
          side.visible &&
          previousWidth > 0 &&
          previousHeight > previousTopLimit &&
          (
            previousWidth !== side.width ||
            previousHeight !== side.height ||
            previousTopLimit !== side.topLimit
          )
        ) {
          var previousUsableHeight = Math.max(1, previousHeight - previousTopLimit);
          var usableHeight = Math.max(1, side.height - side.topLimit);
          side.nodes.forEach(function (node) {
            node.x = node.x * side.width / previousWidth;
            node.y = side.topLimit +
              (node.y - previousTopLimit) * usableHeight / previousUsableHeight;
            node.x = Math.max(node.radius, Math.min(side.width - node.radius, node.x));
            node.y = Math.max(
              side.topLimit + node.radius,
              Math.min(side.height - node.radius, node.y)
            );
          });
        }

        if (side.visible) {
          syncNodeCount(side);
        }
      });

      if (reduceMotion) {
        sides.forEach(function (side) {
          drawSide(side, performance.now(), 0, true);
        });
      }
    }

    function requestLayout() {
      if (layoutQueued) return;
      layoutQueued = true;
      window.requestAnimationFrame(function () {
        layoutQueued = false;
        updateLayout();
      });
    }

    function limitNodeSpeed(node, maximum) {
      var speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed <= maximum || speed === 0) return;
      node.vx = node.vx / speed * maximum;
      node.vy = node.vy / speed * maximum;
    }

    function disturbParticles(side) {
      var pointer = side.pointer;
      var motionLength = Math.sqrt(
        pointer.velocityX * pointer.velocityX +
        pointer.velocityY * pointer.velocityY
      );
      var motionX = motionLength > 0.001 ? pointer.velocityX / motionLength : 0;
      var motionY = motionLength > 0.001 ? pointer.velocityY / motionLength : 0;

      side.nodes.forEach(function (node) {
        var dx = node.x - pointer.x;
        var dy = node.y - pointer.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= disturbanceRadius || distance < 0.001) return;

        var strength = Math.pow(1 - distance / disturbanceRadius, 1.45);
        var normalX = dx / distance;
        var normalY = dy / distance;
        var rotation = motionX * normalY - motionY * normalX >= 0 ? 1 : -1;
        var tangentX = -normalY * rotation;
        var tangentY = normalX * rotation;
        var impulse = (0.011 + Math.min(pointer.speed, 1.8) * 0.017) * strength;

        node.vx += normalX * impulse + tangentX * impulse * 0.58 + motionX * impulse * 0.24;
        node.vy += normalY * impulse + tangentY * impulse * 0.58 + motionY * impulse * 0.24;
        limitNodeSpeed(node, maximumSpeed);
      });
    }

    function updateParticles(side, now, delta, staticFrame) {
      var frameDelta = Math.max(0, Math.min(delta, 32));
      var minimumX = 4;
      var maximumX = side.width - 4;
      var minimumY = side.topLimit + 4;
      var maximumY = side.height - 4;
      var index;
      var compare;

      if (staticFrame) return;

      side.nodes.forEach(function (node) {
        node.phase += node.turnRate * frameDelta;
        node.vx += Math.cos(node.phase) * 0.0000018 * frameDelta;
        node.vy += Math.sin(node.phase * 0.91) * 0.0000018 * frameDelta;

        var speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > 0.0001) {
          var relaxation = Math.min(0.045, frameDelta * 0.00085);
          var targetScale = node.cruiseSpeed / speed;
          var velocityScale = 1 + (targetScale - 1) * relaxation;
          node.vx *= velocityScale;
          node.vy *= velocityScale;
        }

        node.x += node.vx * frameDelta;
        node.y += node.vy * frameDelta;

        var leftEdge = minimumX + node.radius;
        var rightEdge = maximumX - node.radius;
        var topEdge = minimumY + node.radius;
        var bottomEdge = maximumY - node.radius;

        if (node.x < leftEdge) {
          node.x = leftEdge;
          node.vx = Math.abs(node.vx) * 0.96;
        } else if (node.x > rightEdge) {
          node.x = rightEdge;
          node.vx = -Math.abs(node.vx) * 0.96;
        }

        if (node.y < topEdge) {
          node.y = topEdge;
          node.vy = Math.abs(node.vy) * 0.96;
        } else if (node.y > bottomEdge) {
          node.y = bottomEdge;
          node.vy = -Math.abs(node.vy) * 0.96;
        }

        limitNodeSpeed(node, maximumSpeed);
      });

      for (index = 0; index < side.nodes.length; index += 1) {
        var a = side.nodes[index];
        for (compare = index + 1; compare < side.nodes.length; compare += 1) {
          var b = side.nodes[compare];
          var dx = b.x - a.x;
          var dy = b.y - a.y;
          var distance = Math.sqrt(dx * dx + dy * dy);
          var collisionDistance = a.radius + b.radius + 5;
          if (distance >= collisionDistance) continue;

          if (distance < 0.001) {
            dx = Math.cos(a.phase);
            dy = Math.sin(a.phase);
            distance = 1;
          }

          var normalX = dx / distance;
          var normalY = dy / distance;
          var overlap = collisionDistance - distance;
          a.x -= normalX * overlap * 0.5;
          a.y -= normalY * overlap * 0.5;
          b.x += normalX * overlap * 0.5;
          b.y += normalY * overlap * 0.5;

          var relativeVelocity =
            (b.vx - a.vx) * normalX +
            (b.vy - a.vy) * normalY;
          if (relativeVelocity < 0) {
            var impulse = -(1 + 0.92) * relativeVelocity / 2;
            a.vx -= impulse * normalX;
            a.vy -= impulse * normalY;
            b.vx += impulse * normalX;
            b.vy += impulse * normalY;
            limitNodeSpeed(a, maximumSpeed);
            limitNodeSpeed(b, maximumSpeed);
          }
        }
      }
    }

    function drawBackground(side, now, staticFrame) {
      var context = side.context;
      var wash = context.createLinearGradient(0, 0, side.width, 0);
      var scanProgress = staticFrame ? 0.38 : (now * 0.000075) % 1;
      var scanX = -80 + scanProgress * (side.width + 160);
      var x;
      var y;

      wash.addColorStop(0, 'rgba(41, 182, 255, 0.075)');
      wash.addColorStop(0.5, 'rgba(102, 118, 205, 0.025)');
      wash.addColorStop(1, 'rgba(114, 86, 255, 0.085)');
      context.fillStyle = wash;
      context.fillRect(0, side.topLimit, side.width, side.height - side.topLimit);

      context.strokeStyle = 'rgba(74, 116, 214, 0.105)';
      context.lineWidth = 0.6;
      for (x = 24; x < side.width; x += 58) {
        context.beginPath();
        context.moveTo(x, side.topLimit);
        context.lineTo(x, side.height);
        context.stroke();
      }
      for (y = side.topLimit + 0.5; y < side.height; y += 62) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(side.width, y);
        context.stroke();
      }

      var scan = context.createLinearGradient(scanX - 58, 0, scanX + 58, 0);
      scan.addColorStop(0, 'rgba(56, 193, 245, 0)');
      scan.addColorStop(0.5, 'rgba(71, 177, 245, 0.14)');
      scan.addColorStop(1, 'rgba(111, 88, 240, 0)');
      context.fillStyle = scan;
      context.fillRect(scanX - 58, side.topLimit, 116, side.height - side.topLimit);
    }

    function drawConnections(side, positions, now, staticFrame) {
      var context = side.context;
      var maxDistance = side.name === 'field'
        ? 150
        : Math.min(118, Math.max(94, side.width * 0.48));
      var edges = [];
      var index;
      var compare;

      for (index = 0; index < positions.length; index += 1) {
        var a = positions[index];
        if (!a.visible) continue;

        for (compare = index + 1; compare < positions.length; compare += 1) {
          var b = positions[compare];
          if (!b.visible) continue;

          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > maxDistance) continue;

          var alpha = 1 - distance / maxDistance;
          var gradient = context.createLinearGradient(a.x, a.y, b.x, b.y);
          gradient.addColorStop(0, rgba(a.node.color, 0.12 + alpha * 0.27));
          gradient.addColorStop(0.5, rgba(palette.cyan, 0.1 + alpha * 0.23));
          gradient.addColorStop(1, rgba(b.node.color, 0.12 + alpha * 0.27));
          context.strokeStyle = gradient;
          context.lineWidth = 0.55 + alpha * 0.8;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
          edges.push({ a: a, b: b, alpha: alpha, seed: index + compare });
        }
      }

      for (index = 0; index < edges.length; index += 4) {
        var edge = edges[index];
        var progress = staticFrame
          ? (edge.seed * 0.137) % 1
          : (now * 0.00011 + edge.seed * 0.091) % 1;
        var pulseX = edge.a.x + (edge.b.x - edge.a.x) * progress;
        var pulseY = edge.a.y + (edge.b.y - edge.a.y) * progress;
        var pulseColor = edge.seed % 9 === 0 ? palette.amber : palette.cyan;

        context.shadowBlur = 9;
        context.shadowColor = rgba(pulseColor, 0.75);
        context.fillStyle = rgba(pulseColor, 0.62 + edge.alpha * 0.25);
        context.beginPath();
        context.arc(pulseX, pulseY, edge.seed % 9 === 0 ? 1.8 : 1.25, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      }
    }

    function drawPointerResponse(side, positions) {
      var context = side.context;
      var pointer = side.pointer;

      if (!pointer.active) return;

      var aura = context.createRadialGradient(
        pointer.x,
        pointer.y,
        0,
        pointer.x,
        pointer.y,
        52
      );
      aura.addColorStop(0, 'rgba(71, 210, 255, 0.2)');
      aura.addColorStop(0.48, 'rgba(109, 83, 239, 0.1)');
      aura.addColorStop(1, 'rgba(109, 83, 239, 0)');
      context.fillStyle = aura;
      context.beginPath();
      context.arc(pointer.x, pointer.y, 52, 0, Math.PI * 2);
      context.fill();

      positions.forEach(function (position) {
        if (!position.visible) return;
        var dx = pointer.x - position.x;
        var dy = pointer.y - position.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= 148) return;

        context.strokeStyle = rgba(palette.cyan, (1 - distance / 148) * 0.34);
        context.lineWidth = 0.9;
        context.beginPath();
        context.moveTo(pointer.x, pointer.y);
        context.lineTo(position.x, position.y);
        context.stroke();
      });

      context.strokeStyle = rgba(palette.cyan, 0.62);
      context.lineWidth = 0.9;
      context.beginPath();
      context.arc(pointer.x, pointer.y, 11 + Math.min(pointer.speed, 1.5) * 3, 0, Math.PI * 2);
      context.stroke();
    }

    function drawNodes(side, positions, now, staticFrame) {
      var context = side.context;

      positions.forEach(function (position) {
        var node = position.node;
        var breathe = staticFrame ? 1 : 0.9 + Math.sin(now * 0.0012 + node.phase) * 0.1;
        if (!position.visible) return;

        context.shadowBlur = node.radius > 2.5 ? 15 : 8;
        context.shadowColor = rgba(node.color, 0.8);
        context.fillStyle = rgba(node.color, 0.78);
        context.beginPath();
        context.arc(position.x, position.y, node.radius * breathe, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;

        if (node.radius > 2.5) {
          context.strokeStyle = rgba(node.color, 0.34);
          context.lineWidth = 0.75;
          context.beginPath();
          context.arc(position.x, position.y, node.radius * 2.8, 0, Math.PI * 2);
          context.stroke();
        }
      });
    }

    function drawClickPulses(side, delta) {
      var context = side.context;
      var index;

      for (index = side.pulses.length - 1; index >= 0; index -= 1) {
        var pulse = side.pulses[index];
        pulse.progress += delta / 920;
        if (pulse.progress >= 1) {
          side.pulses.splice(index, 1);
          continue;
        }

        var radius = 8 + pulse.progress * 64;
        var alpha = 1 - pulse.progress;
        context.strokeStyle = rgba(palette.cyan, alpha * 0.64);
        context.lineWidth = 1.4;
        context.shadowBlur = 12;
        context.shadowColor = rgba(palette.violet, alpha * 0.75);
        context.beginPath();
        context.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
        context.stroke();
        context.shadowBlur = 0;

        context.strokeStyle = rgba(palette.amber, alpha * 0.34);
        context.lineWidth = 0.8;
        context.beginPath();
        context.arc(pulse.x, pulse.y, radius * 0.7, 0, Math.PI * 2);
        context.stroke();
      }
    }

    function drawSide(side, now, delta, staticFrame) {
      var context = side.context;
      var positions;

      context.clearRect(0, 0, side.width, side.height);
      if (!side.visible || side.width < minFieldWidth) return;

      updateParticles(side, now, delta, staticFrame);
      positions = side.nodes.map(function (node) {
        return {
          x: node.x,
          y: node.y,
          node: node,
          visible:
            node.y >= side.topLimit + 4 &&
            node.y <= side.height - 4
        };
      });

      context.save();
      context.beginPath();
      context.rect(0, side.topLimit, side.width, side.height - side.topLimit);
      context.clip();
      drawBackground(side, now, staticFrame);
      drawConnections(side, positions, now, staticFrame);
      drawPointerResponse(side, positions);
      drawNodes(side, positions, now, staticFrame);
      drawClickPulses(side, staticFrame ? 0 : delta);
      context.restore();
    }

    function animate(now) {
      var delta = Math.min(40, now - lastFrame);
      lastFrame = now;
      sides.forEach(function (side) {
        drawSide(side, now, delta, false);
      });
      animationFrame = window.requestAnimationFrame(animate);
    }

    function sideAt(clientX, clientY) {
      var match = null;
      sides.forEach(function (side) {
        var localX = clientX - side.left;
        if (
          side.visible &&
          localX >= 0 &&
          localX <= side.width &&
          clientY >= side.topLimit
        ) {
          match = side;
        }
      });
      return match;
    }

    if (finePointer && !reduceMotion) {
      window.addEventListener('pointermove', function (event) {
        var activeSide = sideAt(event.clientX, event.clientY);
        var moveTime = performance.now();

        sides.forEach(function (side) {
          var pointer = side.pointer;
          var wasActive = pointer.active;
          pointer.active = side === activeSide;
          if (pointer.active) {
            var localX = event.clientX - side.left;
            if (wasActive && pointer.lastMove) {
              var moveDelta = Math.max(1, moveTime - pointer.lastMove);
              var moveX = localX - pointer.lastX;
              var moveY = event.clientY - pointer.lastY;
              var instantSpeed = Math.sqrt(moveX * moveX + moveY * moveY) / moveDelta;
              pointer.speed = pointer.speed * 0.34 + instantSpeed * 0.66;
              pointer.velocityX = moveX / moveDelta;
              pointer.velocityY = moveY / moveDelta;
            } else {
              pointer.speed = 0;
              pointer.velocityX = 0;
              pointer.velocityY = 0;
            }
            pointer.x = localX;
            pointer.y = event.clientY;
            pointer.lastX = localX;
            pointer.lastY = event.clientY;
            pointer.lastMove = moveTime;
            disturbParticles(side);
          } else if (wasActive) {
            pointer.speed = 0;
            pointer.velocityX = 0;
            pointer.velocityY = 0;
            pointer.lastMove = 0;
          }
        });
      }, { passive: true });

      window.addEventListener('pointerout', function (event) {
        if (event.relatedTarget) return;
        sides.forEach(function (side) {
          side.pointer.active = false;
          side.pointer.speed = 0;
          side.pointer.velocityX = 0;
          side.pointer.velocityY = 0;
          side.pointer.lastMove = 0;
        });
      }, { passive: true });

      window.addEventListener('pointerdown', function (event) {
        var interactiveTarget = event.target && event.target.closest
          ? event.target.closest('a, button, input, select, textarea, #toc')
          : null;
        var side = interactiveTarget ? null : sideAt(event.clientX, event.clientY);

        if (!side) return;
        side.pulses.push({
          x: event.clientX - side.left,
          y: event.clientY,
          progress: 0
        });
      }, { passive: true });
    }

    window.addEventListener('resize', requestLayout, { passive: true });
    window.addEventListener('scroll', function () {
      requestLayout();
      window.requestAnimationFrame(requestLayout);
    }, { passive: true });

    if ('ResizeObserver' in window) {
      new ResizeObserver(requestLayout).observe(board);
    }

    updateLayout();
    if (!reduceMotion) {
      animationFrame = window.requestAnimationFrame(animate);
    }

    document.addEventListener('visibilitychange', function () {
      if (reduceMotion) return;
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else if (!animationFrame) {
        lastFrame = performance.now();
        animationFrame = window.requestAnimationFrame(animate);
      }
    });
  }

  function ready() {
    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var notFoundPage = document.querySelector('.mirage-404');
    var revealTargets = document.querySelectorAll(
      '.index-card, .about-info, .markdown-body > h1, .markdown-body > h2, .markdown-body > .note, .markdown-body > p, .pdf-shell'
    );

    if (notFoundPage) {
      document.body.classList.add('is-mirage-404');
      notFoundPage.querySelectorAll('[data-mirage-go-back]').forEach(function (link) {
        link.addEventListener('click', function (event) {
          if (window.history.length <= 1) return;
          event.preventDefault();
          window.history.back();
        });
      });
    }

    root.classList.add('mirage-motion-ready');
    revealTargets.forEach(function (element, index) {
      element.classList.add('mirage-reveal');
      element.style.transitionDelay = Math.min(index % 5, 4) * 55 + 'ms';
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealTargets.forEach(function (element) {
        element.classList.add('is-visible');
      });
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });

      revealTargets.forEach(function (element) {
        observer.observe(element);
      });
    }

    document.querySelectorAll('.index-card, #board').forEach(function (surface) {
      surface.addEventListener('pointermove', function (event) {
        var rect = surface.getBoundingClientRect();
        surface.style.setProperty('--pointer-x', ((event.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
        surface.style.setProperty('--pointer-y', ((event.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
      }, { passive: true });
    });

    initAutoHideNavbar();
    initGutterNetwork(reduceMotion);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  } else {
    ready();
  }
}());
