/* Lo que pasa en el cielo mientras Bel camina.

   Es fondo, no espectáculo: aparece cada tanto, tarda en cruzar, y si la
   jugadora estaba mirando el piso se lo pierde. Esa es la idea — que quien
   mire arriba sea recompensada, no que la escena le grite.

   Nunca hay dos cosas a la vez, y entre una y otra pasan como mínimo veinte
   segundos. */
var Cielo = (function () {
  'use strict';

  var TIPOS = ['fugaz', 'viajera', 'formacion', 'pulso', 'sombra', 'satelite',
               'nave'];

  function crear() {
    return {
      evento: null,
      // La primera aparición llega temprano, para que se note que esto existe.
      espera: 6 + Math.random() * 8,
      vistos: {}
    };
  }

  /* Elige el próximo evento. Las más llamativas salen menos seguido. */
  function elegir(c) {
    var r = Math.random();
    var tipo;
    /* La nave sale seguido y a proposito. No es un guino escondido: es lo que
       ella ve siempre, asi que tiene que estar ahi arriba varias veces por
       partida, sin que el juego la senale nunca. */
    if (r < .22) tipo = 'nave';
    else if (r < .46) tipo = 'fugaz';
    else if (r < .62) tipo = 'satelite';
    else if (r < .76) tipo = 'viajera';
    else if (r < .87) tipo = 'pulso';
    else if (r < .96) tipo = 'formacion';
    else tipo = 'sombra';

    var haciaLaDerecha = Math.random() < .5;
    c.evento = {
      tipo: tipo,
      t: 0,
      dur: tipo === 'fugaz' ? 1.1
         : tipo === 'satelite' ? 14
         : tipo === 'viajera' ? 9
         : tipo === 'pulso' ? 4.5
         : tipo === 'formacion' ? 8
         : tipo === 'nave' ? 13
         : 11,                                   // sombra
      dir: haciaLaDerecha ? 1 : -1,
      x0: haciaLaDerecha ? -.12 : 1.12,
      y0: .06 + Math.random() * .30,
      inclina: (Math.random() - .5) * .16,
      semilla: Math.random() * 6.28
    };
    c.vistos[tipo] = (c.vistos[tipo] || 0) + 1;
  }

  function actualizar(c, dt) {
    if (c.evento) {
      c.evento.t += dt;
      if (c.evento.t >= c.evento.dur) {
        c.evento = null;
        c.espera = 20 + Math.random() * 34;
      }
      return;
    }
    c.espera -= dt;
    if (c.espera <= 0) elegir(c);
  }

  /* Curva de aparición y desvanecimiento: entra y sale sin cortes. */
  function sobre(u, subida, bajada) {
    if (u < subida) return u / subida;
    if (u > 1 - bajada) return (1 - u) / bajada;
    return 1;
  }

  function punto(cx, x, y, r, col, alfa) {
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    var g = cx.createRadialGradient(x, y, 0, x, y, r * 7);
    g.addColorStop(0, 'rgba(' + col + ',' + (alfa * .5) + ')');
    g.addColorStop(.4, 'rgba(' + col + ',' + (alfa * .14) + ')');
    g.addColorStop(1, 'rgba(' + col + ',0)');
    cx.fillStyle = g;
    cx.beginPath(); cx.arc(x, y, r * 7, 0, 6.2832); cx.fill();
    cx.fillStyle = 'rgba(255,252,244,' + alfa + ')';
    cx.beginPath(); cx.arc(x, y, r, 0, 6.2832); cx.fill();
    cx.restore();
  }

  function dibujar(cx, c, W, H, t) {
    var e = c.evento;
    if (!e) return;
    var u = e.t / e.dur;

    if (e.tipo === 'fugaz') {
      // Rápida, con estela. Dura poco más de un segundo.
      var a = sobre(u, .12, .40);
      var fx = W * (e.x0 + e.dir * u * 1.24);
      var fy = H * (e.y0 + u * .16);
      var largo = W * .085;
      cx.save();
      cx.globalCompositeOperation = 'lighter';
      var g = cx.createLinearGradient(fx, fy, fx - e.dir * largo, fy - H * .022);
      g.addColorStop(0, 'rgba(255,250,235,' + (.75 * a) + ')');
      g.addColorStop(1, 'rgba(255,250,235,0)');
      cx.strokeStyle = g;
      cx.lineWidth = 2.2;
      cx.lineCap = 'round';
      cx.beginPath();
      cx.moveTo(fx, fy);
      cx.lineTo(fx - e.dir * largo, fy - H * .022);
      cx.stroke();
      cx.restore();
      punto(cx, fx, fy, 1.6, '255,250,235', .85 * a);

    } else if (e.tipo === 'satelite') {
      // Un puntito parejo que cruza despacio, como un satélite de verdad.
      var a2 = sobre(u, .10, .18);
      var sx = W * (e.x0 + e.dir * u * 1.24);
      var sy = H * (e.y0 + u * e.inclina);
      punto(cx, sx, sy, 1.3, '226,232,255', .55 * a2);

    } else if (e.tipo === 'viajera') {
      // Una luz sola que cruza, cambia de color y se apaga de golpe.
      var a3 = sobre(u, .14, .10);
      var vx = W * (e.x0 + e.dir * u * 1.24);
      var vy = H * (e.y0 + Math.sin(u * 3.1 + e.semilla) * .035);
      var col = u < .5 ? '255,214,150' : '170,225,255';
      // Se apaga y se enciende, sin ritmo fijo.
      var late = .55 + .45 * Math.sin(e.t * 3.2 + e.semilla);
      punto(cx, vx, vy, 2.0, col, .70 * a3 * late);

    } else if (e.tipo === 'nave') {
      /* Cruza despacio, muy chica y muy tenue, y a mitad de camino se queda
         quieta un momento antes de seguir. Eso es lo unico que la delata como
         algo que no es un satelite: los satelites no frenan. */
      var an = sobre(u, .16, .16);
      // El alto: avanza, se detiene entre .42 y .58, y retoma.
      var av = u < .42 ? u
             : u < .58 ? .42
             : .42 + (u - .58) * (.58 / .42);
      var nx = W * (e.x0 + e.dir * av * 1.26);
      var ny = H * (e.y0 + e.inclina * av);
      var R = Math.max(4.2, Math.min(W, H) * .017);
      var quieta = (u >= .42 && u < .58) ? 1 : 0;

      cx.save();
      cx.globalAlpha = an * (.38 + quieta * .24);
      // El casco: una lenteja, no un circulo.
      cx.fillStyle = 'rgba(206,222,255,.85)';
      cx.beginPath();
      cx.ellipse(nx, ny, R * 1.9, R * .52, e.inclina * 2, 0, 6.2832);
      cx.fill();
      // La cupula.
      cx.fillStyle = 'rgba(226,238,255,.6)';
      cx.beginPath();
      cx.ellipse(nx, ny - R * .30, R * .78, R * .40, 0, Math.PI, 6.2832);
      cx.fill();
      // Tres luces abajo, latiendo desfasadas.
      for (var ln = -1; ln <= 1; ln++) {
        var late2 = .5 + .5 * Math.sin(e.t * 2.6 + ln * 2.1 + e.semilla);
        punto(cx, nx + ln * R * 1.05, ny + R * .30, R * .19,
              ln === 0 ? '255,226,170' : '170,214,255', (.5 + late2 * .5) * an);
      }
      // Mientras esta quieta, un halo apenas perceptible.
      if (quieta) {
        var gh2 = cx.createRadialGradient(nx, ny, R * .5, nx, ny, R * 5.5);
        gh2.addColorStop(0, 'rgba(190,215,255,.16)');
        gh2.addColorStop(1, 'rgba(190,215,255,0)');
        cx.fillStyle = gh2;
        cx.beginPath(); cx.arc(nx, ny, R * 5.5, 0, 6.2832); cx.fill();
      }
      cx.restore();

    } else if (e.tipo === 'formacion') {
      // Tres luces que se mueven juntas, guardando la distancia.
      var a4 = sobre(u, .16, .16);
      var bx = W * (e.x0 + e.dir * u * 1.20);
      var by = H * (e.y0 + Math.sin(u * 2.4 + e.semilla) * .02);
      var sep = W * .028;
      var giro = e.t * .25 + e.semilla;
      for (var i = 0; i < 3; i++) {
        var ang = giro + i * 2.094;
        punto(cx,
          bx + Math.cos(ang) * sep * e.dir,
          by + Math.sin(ang) * sep * .38,
          1.7, '200,235,255', .58 * a4);
      }

    } else if (e.tipo === 'pulso') {
      // Un resplandor que crece y se va, sin nada adentro.
      var a5 = sobre(u, .30, .45);
      var px = W * (.20 + e.semilla * .09);
      var py = H * e.y0;
      var r = H * (.02 + u * .10);
      cx.save();
      cx.globalCompositeOperation = 'lighter';
      var pg = cx.createRadialGradient(px, py, 0, px, py, r);
      pg.addColorStop(0, 'rgba(190,225,255,' + (.16 * a5) + ')');
      pg.addColorStop(.5, 'rgba(160,200,255,' + (.05 * a5) + ')');
      pg.addColorStop(1, 'rgba(160,200,255,0)');
      cx.fillStyle = pg;
      cx.beginPath(); cx.arc(px, py, r, 0, 6.2832); cx.fill();
      cx.restore();

    } else if (e.tipo === 'sombra') {
      // Algo oscuro que pasa por delante de las estrellas y las tapa. No se ve:
      // se nota porque falta cielo.
      var a6 = sobre(u, .22, .22);
      var ox = W * (e.x0 + e.dir * u * 1.24);
      var oy = H * e.y0;
      var an = W * .14, al = H * .045;
      cx.save();
      cx.globalAlpha = .82 * a6;
      cx.fillStyle = '#080b14';
      cx.beginPath();
      cx.ellipse(ox, oy, an, al, e.inclina, 0, 6.2832);
      cx.fill();
      // Un borde apenas más claro, para que no sea un agujero plano.
      cx.globalAlpha = .10 * a6;
      cx.strokeStyle = '#3d4a68';
      cx.lineWidth = 1.5;
      cx.stroke();
      cx.restore();
    }
  }

  /* Para el debug: forzar un evento concreto. */
  function forzar(c, tipo) {
    elegir(c);
    c.evento.tipo = tipo;
    c.evento.t = 0;
    c.evento.dur = tipo === 'fugaz' ? 1.1
      : tipo === 'satelite' ? 14
      : tipo === 'viajera' ? 9
      : tipo === 'pulso' ? 4.5
      : tipo === 'formacion' ? 8 : 11;
  }

  /* La luna del hilo.

     No es un evento como los demas: esta siempre, en el mismo rincon, y su
     fase no es decorativa — crece con lo que la jugadora va encontrando. De
     luna nueva, cuando no vio nada, a llena cuando vio casi todo. Al final, la
     fase que quedo en el cielo es la misma que la del arcano que le toca, asi
     que la carta no le dice nada que no estuviera arriba toda la partida.

     `ilum` va de 0 a 1. `visible` se apaga cuando el lugar del recorrido ES la
     luna: dos lunas en el mismo cuadro se leen como un error de dibujo. */
  function luna(cx, W, H, t, ilum, visible, glifo) {
    if (!visible) return;
    var R = Math.max(13, Math.min(W, H) * .036);
    var lx = W * .135, ly = H * .148;
    ilum = Math.max(0, Math.min(1, ilum));

    cx.save();

    // El halo crece con la fase: una luna nueva casi no ilumina nada.
    var halo = cx.createRadialGradient(lx, ly, R * .7, lx, ly, R * (3.4 + ilum * 2.2));
    halo.addColorStop(0, 'rgba(214,222,255,' + (.05 + ilum * .13).toFixed(3) + ')');
    halo.addColorStop(1, 'rgba(214,222,255,0)');
    cx.fillStyle = halo;
    cx.beginPath(); cx.arc(lx, ly, R * (3.4 + ilum * 2.2), 0, 6.2832); cx.fill();

    /* El disco a oscuras. Igual se ve un poco: es la luz de la Tierra
       rebotando en la cara nocturna, y sin eso una luna nueva seria
       simplemente nada. */
    cx.fillStyle = 'rgba(146,155,200,.16)';
    cx.beginPath(); cx.arc(lx, ly, R, 0, 6.2832); cx.fill();

    /* La parte iluminada, como una forma propia en vez de un recorte.

       Recortando con destination-out se borraba tambien el disco de abajo y la
       parte oscura quedaba negra dura, que no es como se ve una luna: la mitad
       a oscuras sigue estando ahi. Esto arma el contorno de la fase — medio
       circulo mas media elipse — y lo rellena.

       La luz entra por la IZQUIERDA porque asi se ve creciendo desde el
       hemisferio sur, que es desde donde la mira ella. */
    if (ilum > .012) {
      var k = 1 - 2 * ilum;              // 1 nueva · 0 media · -1 llena
      cx.fillStyle = 'rgba(238,242,255,.92)';
      cx.beginPath();
      cx.arc(lx, ly, R, Math.PI / 2, -Math.PI / 2, false);
      /* El sentido del arco es lo que decide si la fase sale fina o gibosa,
         y estaba al reves: con k > 0 (menos de media luna) el terminador
         tiene que curvarse hacia adentro, o sea recorrer la elipse por el
         lado de la luz. Al reves, un indicio encontrado pintaba casi luna
         llena y los ocho la apagaban del todo. */
      cx.ellipse(lx, ly, R * Math.abs(k), R, 0, -Math.PI / 2, Math.PI / 2, k > 0);
      cx.closePath();
      cx.fill();
    }

    // El borde, siempre, para que el disco se lea aunque este a oscuras.
    cx.strokeStyle = 'rgba(206,214,250,.20)';
    cx.lineWidth = Math.max(1, R * .045);
    cx.beginPath(); cx.arc(lx, ly, R, 0, 6.2832); cx.stroke();

    /* El signo en el que esta la luna esta noche, de verdad, calculado con las
       efemerides. Nadie que no sepa de esto lo va a mirar dos veces. */
    if (glifo) {
      cx.globalAlpha = .34;
      cx.fillStyle = 'rgba(214,222,255,1)';
      cx.font = Math.round(R * .62) + 'px "Segoe UI Symbol","Apple Symbols",serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText(glifo, lx, ly + R * 1.75);
    }
    cx.restore();
  }

  return { crear: crear, actualizar: actualizar, dibujar: dibujar, forzar: forzar,
           luna: luna, TIPOS: TIPOS };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = Cielo; }
