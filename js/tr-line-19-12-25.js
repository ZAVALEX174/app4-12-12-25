// Базовый класс для всех объектов на холсте
class CanvasObject {
  constructor(type, x, y, width, height, color = '#3498db', label = 'Объект') {
    this.id = Date.now() + Math.random();
    this.type = type;
    this.x = x - width / 2;
    this.y = y - height / 2;
    this.width = width;
    this.height = height;
    this.color = color;
    this.label = label;
    this.selected = false;
    this.properties = {};
    this.airValue = 0; // НОВОЕ ПОЛЕ
    this.image = null;
    this.imageLoaded = false;
    this.rotation = 0;
  }

  get center() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  getVertices() {
    const center = this.center;
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    const angle = this.rotation * Math.PI / 180;

    const vertices = [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight }
    ];

    return vertices.map(v => {
      const rotatedX = v.x * Math.cos(angle) - v.y * Math.sin(angle);
      const rotatedY = v.x * Math.sin(angle) + v.y * Math.cos(angle);
      return {
        x: center.x + rotatedX,
        y: center.y + rotatedY
      };
    });
  }

  getSides() {
    const vertices = this.getVertices();
    const sides = [];

    for (let i = 0; i < vertices.length; i++) {
      const nextIndex = (i + 1) % vertices.length;
      sides.push({
        start: vertices[i],
        end: vertices[nextIndex],
        sideIndex: i
      });
    }

    return sides;
  }

  loadImage(imageUrl) {
    return new Promise((resolve, reject) => {
      this.image = new Image();
      this.image.onload = () => {
        this.imageLoaded = true;
        resolve();
      };
      this.image.onerror = () => {
        this.imageLoaded = false;
        reject(new Error('Не удалось загрузить изображение'));
      };
      this.image.src = imageUrl;
    });
  }

  rotate(degrees = 90) {
    this.rotation = (this.rotation + degrees) % 360;
  }

  draw(ctx) {
    if (this.image && this.imageLoaded) {
      ctx.save();
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
    }

    if (this.selected) {
      this.drawSelection(ctx);
      // Отображаем airValue при выделении
      ctx.fillStyle = '#ff0000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`Air: ${this.airValue}`, this.x - 5, this.y - 30);
    }
  }

  drawSelection(ctx) {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
    ctx.fillStyle = '#ff0000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${this.rotation}°`, this.x - 5, this.y - 15);
    ctx.setLineDash([]);
  }

  isPointInside(x, y) {
    const center = this.center;
    const angle = -this.rotation * Math.PI / 180;

    const translatedX = x - center.x;
    const translatedY = y - center.y;

    const rotatedX = translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
    const rotatedY = translatedX * Math.sin(angle) + translatedY * Math.cos(angle);

    return Math.abs(rotatedX) <= this.width / 2 && Math.abs(rotatedY) <= this.height / 2;
  }

  getProperties() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: this.color,
      label: this.label,
      rotation: this.rotation,
      airValue: this.airValue,
      ...this.properties
    };
  }

  setPosition(x, y) {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
  }

  setSize(width, height) {
    const center = this.center;
    this.width = width;
    this.height = height;
    this.setPosition(center.x, center.y);
  }

  setLabel(label) {
    this.label = label;
  }

  setRotation(rotation) {
    this.rotation = rotation;
  }

  getAirValue() {
    return this.airValue || 0;
  }

  setAirValue(value) {
    this.airValue = parseFloat(value) || 0;
  }
}

class ImageObject extends CanvasObject {
  constructor(type, x, y, width, height, imageUrl, label = 'Объект') {
    super(type, x, y, width, height, '#3498db', label);
    this.properties = { imageUrl };
    this.imageLoading = false;

    if (imageUrl) {
      this.loadImageAsync(imageUrl);
    }
  }

  async loadImageAsync(imageUrl) {
    this.imageLoading = true;
    try {
      await this.loadImage(imageUrl);
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
    } finally {
      this.imageLoading = false;
      if (this.onImageLoad) this.onImageLoad();
    }
  }

  draw(ctx) {
    if (this.image && this.imageLoaded) {
      this.drawImage(ctx);
    } else {
      this.drawPlaceholder(ctx);
    }

    this.drawLabel(ctx);

    if (this.selected) {
      this.drawSelection(ctx);
    }
  }

  drawImage(ctx) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }

  drawPlaceholder(ctx) {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = '#999';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
  }

  drawLabel(ctx) {
    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height + 5);
  }
}

// Класс для точки пересечения с уникальным ID
class IntersectionPoint {
  static nextId = 1;

  constructor(x, y) {
    this.id = IntersectionPoint.nextId++;
    this.x = x;
    this.y = y;
    this.intersections = [];
    this.formula = 0;
  }

  isNear(otherPoint, tolerance = 5) {
    const dx = this.x - otherPoint.x;
    const dy = this.y - otherPoint.y;
    return Math.sqrt(dx * dx + dy * dy) < tolerance;
  }

  getInfo() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      intersectionCount: this.intersections.length,
      intersections: this.intersections,
      formula: this.formula
    };
  }

  static resetCounter() {
    IntersectionPoint.nextId = 1;
  }
}

class ObjectFactory {
  static #objectConfigs = {
    'door': {
      width: 30,
      height: 30,
      image: './img/dvercloses.png',
      label: 'Дверь закрытая',
      category: 'doors_windows',
      airValue: 1.0
    },
    'door2': {
      width: 30,
      height: 30,
      image: './img/dverwentoknowood.png',
      label: 'Дверь деревянная с вентоткном',
      category: 'doors_windows',
      airValue: 1.0
    },
    'door3': {
      width: 40,
      height: 30,
      image: './img/dverventrech.png',
      label: 'Дверь с вентрешеткой',
      category: 'doors_windows',
      airValue: 1.0
    },
    'door4': {
      width: 30,
      height: 30,
      image: './img/dveropenmetall.png',
      label: 'Дверь металлическая открытая',
      category: 'doors_windows',
      airValue: 1.0
    },
    'fan': {
      width: 40,
      height: 40,
      image: './img/fan.png',
      label: 'Вентилятор основной',
      category: 'fan',
      airValue: 1.0
    },
    'fan2': {
      width: 40,
      height: 40,
      image: './img/fan2.png',
      label: 'Вентилятор',
      category: 'fan',
      airValue: 1.0
    },
    'fire': {
      width: 40,
      height: 40,
      image: './img/fire.png',
      label: 'Огонь',
      category: 'fire',
      airValue: 1.0
    },
    'fire2': {
      width: 40,
      height: 40,
      image: './img/pozarniigidrant.png',
      label: 'Пожарный гидрант',
      category: 'fire',
      airValue: 1.0
    },
    'boom': {
      width: 40,
      height: 40,
      image: './img/massovievzivniepaboti.png',
      label: 'Массовые взрывные работы',
      category: 'boom',
      airValue: 1.0
    },
    'boom2': {
      width: 40,
      height: 40,
      image: './img/vzrivnieraboti.png',
      label: 'Взрывные работы',
      category: 'boom',
      airValue: 1.0
    },
    'medical': {
      width: 40,
      height: 40,
      image: './img/medpunkt.png',
      label: 'Медицинский пункт',
      category: 'medical',
      airValue: 1.0
    },
    'building': {
      width: 30,
      height: 30,
      image: './img/nadshahtnoe.png',
      label: 'Надшахтное строение',
      category: 'building',
      airValue: 1.0
    },
    'pumps': {
      width: 40,
      height: 40,
      image: './img/nanospogruznoi.png',
      label: 'Насос погружной',
      category: 'pumps',
      airValue: 1.0
    },
    'pumps2': {
      width: 40,
      height: 40,
      image: './img/nasosnayastancia.png',
      label: 'Насосная станция',
      category: 'pumps',
      airValue: 1.0
    },
    'people': {
      width: 40,
      height: 40,
      image: './img/people.png',
      label: 'Люди',
      category: 'people',
      airValue: 1.0
    },
    'jumper': {
      width: 30,
      height: 30,
      image: './img/petemichkabeton.png',
      label: 'Перемычка бетонная',
      category: 'jumper',
      airValue: 1.0
    },
    'jumper2': {
      width: 30,
      height: 30,
      image: './img/petemichkakirpich.png',
      label: 'Перемычка кирпичная',
      category: 'jumper',
      airValue: 1.0
    },
    'jumper3': {
      width: 30,
      height: 30,
      image: './img/petemichkametall.png',
      label: 'Перемычка металлическая',
      category: 'jumper',
      airValue: 1.0
    },
    'jumper4': {
      width: 30,
      height: 30,
      image: './img/petemichkawood.png',
      label: 'Перемычка деревянная',
      category: 'jumper',
      airValue: 1.0
    },
    'phone': {
      width: 40,
      height: 40,
      image: './img/phone.png',
      label: 'Телефон',
      category: 'phone',
      airValue: 1.0
    },
    'equipment': {
      width: 40,
      height: 40,
      image: './img/samohodnoe.png',
      label: 'Самоходное оборудование',
      category: 'equipment',
      airValue: 1.0
    },
    'entrance': {
      width: 40,
      height: 20,
      image: './img/zapasvhod.png',
      label: 'Запасной вход',
      category: 'entrance',
      airValue: 1.0
    }
  };

  static createObject(type, x, y) {
    const config = this.#objectConfigs[type];
    if (config) {
      const obj = new ImageObject(type, x, y, config.width, config.height, config.image, config.label);
      if (config.airValue !== undefined) {
        obj.setAirValue(config.airValue);
      }
      return obj;
    }
    return new CanvasObject('generic', x, y, 50, 50, '#3498db', 'Объект');
  }

  static getObjectTypes() {
    return Object.entries(this.#objectConfigs).map(([type, config]) => ({
      type,
      name: config.label,
      icon: config.image,
      category: config.category
    }));
  }
}

class Editor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    this.bufferCanvas = document.createElement('canvas');
    this.bufferCtx = this.bufferCanvas.getContext('2d');
    this.needsRedraw = true;

    // Основные свойства
    this.mode = 'draw';
    this.lineColor = '#ffffff';
    this.lineWidth = 10;
    this.snapToGrid = true;
    this.snapToPoints = true;
    this.gridSize = 20;
    this.currentObjectType = null;

    // Состояния редактора
    this.isDrawing = false;
    this.isMoving = false;
    this.isEditing = false;
    this.selectedElement = null;
    this.dragOffset = { x: 0, y: 0 };
    this.editingPoint = null;
    this.editingLength = false;
    this.lengthEditOverlay = null;

    // Данные
    this.lines = [];
    this.objects = [];
    this.tempLine = null;
    this.intersectionPoints = [];
    this.intersectionInfo = [];

    // Флаги отображения
    this.showIntersections = false;
    this.showTrackProperties = false;
    this.showEndpoints = true;
    this.showTrValues = true;

    // Оптимизация
    this.lastDrawnTempLine = null;
    this.tempLineDrawn = false;
    this.animationFrameId = null;
    this.mousePos = { x: 0, y: 0 };

    // Флаг для отслеживания изменений tr
    this.trValuesChanged = false;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupUI();
    this.setupObjectLibrary();
    this.handleResize();
    this.redraw();
  }

  // НОВЫЙ МЕТОД: Получить все линии в точке пересечения с их endpoint
  getLinesAtIntersectionPoint(point) {
    const linesInfo = {
      startLines: [], // Линии, которые приходят началом
      endLines: [],   // Линии, которые приходят концом
      middleLines: [] // Линии, которые пересекаются серединой
    };

    point.intersections.forEach(intersection => {
      if (intersection.type === 'line-line') {
        if (intersection.line1Endpoint === 'start') {
          linesInfo.startLines.push({
            lineId: intersection.line1Id,
            line: intersection.line1,
            endpoint: 'start'
          });
        } else if (intersection.line1Endpoint === 'end') {
          linesInfo.endLines.push({
            lineId: intersection.line1Id,
            line: intersection.line1,
            endpoint: 'end'
          });
        } else {
          linesInfo.middleLines.push({
            lineId: intersection.line1Id,
            line: intersection.line1,
            endpoint: 'middle'
          });
        }

        if (intersection.line2Endpoint === 'start') {
          linesInfo.startLines.push({
            lineId: intersection.line2Id,
            line: intersection.line2,
            endpoint: 'start'
          });
        } else if (intersection.line2Endpoint === 'end') {
          linesInfo.endLines.push({
            lineId: intersection.line2Id,
            line: intersection.line2,
            endpoint: 'end'
          });
        } else {
          linesInfo.middleLines.push({
            lineId: intersection.line2Id,
            line: intersection.line2,
            endpoint: 'middle'
          });
        }
      } else if (intersection.type === 'line-object') {
        if (intersection.lineEndpoint === 'start') {
          linesInfo.startLines.push({
            lineId: intersection.lineId,
            line: intersection.line,
            endpoint: 'start'
          });
        } else if (intersection.lineEndpoint === 'end') {
          linesInfo.endLines.push({
            lineId: intersection.lineId,
            line: intersection.line,
            endpoint: 'end'
          });
        } else {
          linesInfo.middleLines.push({
            lineId: intersection.lineId,
            line: intersection.line,
            endpoint: 'middle'
          });
        }
      }
    });

    // Удаляем дубликаты (если одна линия упоминается несколько раз)
    const uniqueLines = (arr) => {
      const seen = new Set();
      return arr.filter(item => {
        if (seen.has(item.lineId)) return false;
        seen.add(item.lineId);
        return true;
      });
    };

    linesInfo.startLines = uniqueLines(linesInfo.startLines);
    linesInfo.endLines = uniqueLines(linesInfo.endLines);
    linesInfo.middleLines = uniqueLines(linesInfo.middleLines);

    return linesInfo;
  }

  // НОВЫЙ МЕТОД: Применить правило для tr в точке пересечения (с учетом airValue объектов)
  applyTrRuleAtIntersectionPoint(point) {
    const linesInfo = this.getLinesAtIntersectionPoint(point);
    const startLines = linesInfo.startLines;
    const endLines = linesInfo.endLines;

    console.log(`Точка #${point.id}: Началом приходит ${startLines.length} линий, Концом приходит ${endLines.length} линий`);

    // Проверяем, есть ли в точке объект с airValue
    let objectAirValue = null;
    point.intersections.forEach(intersection => {
      if (intersection.type === 'line-object' && intersection.object && intersection.object.airValue) {
        objectAirValue = intersection.object.airValue;
        console.log(`В точке #${point.id} найден объект с airValue = ${objectAirValue}`);
      }
    });

    // Если есть объект с airValue, используем его для линий, выходящих началом
    if (objectAirValue !== null && startLines.length > 0) {
      console.log(`Используем airValue объекта (${objectAirValue}) для линий, выходящих началом из точки #${point.id}`);
      startLines.forEach(info => {
        const line = info.line;
        if (line.tr !== objectAirValue) {
          console.log(`Устанавливаем tr для линии ${line.id} = ${objectAirValue} (airValue объекта)`);
          line.tr = objectAirValue;
          this.trValuesChanged = true;
        }
      });
      return; // Не применяем стандартные правила, если есть объект
    }

    // Стандартные правила (если нет объекта с airValue):
    // Правило а): одна линия концом и одна линия началом
    if (endLines.length === 1 && startLines.length === 1) {
      const endLine = endLines[0].line;
      const startLine = startLines[0].line;

      if (endLine.tr !== undefined && startLine.tr !== endLine.tr) {
        console.log(`Правило а): tr(start) = tr(end): ${startLine.tr} -> ${endLine.tr}`);
        startLine.tr = endLine.tr;
        this.trValuesChanged = true;
      }
    }
    // Правило б): одна линия концом и несколько линий началом
    else if (endLines.length === 1 && startLines.length > 1) {
      const endLine = endLines[0].line;
      const endTr = endLine.tr || 100;

      const newTr = endTr / startLines.length;

      startLines.forEach(info => {
        const line = info.line;
        if (line.tr !== newTr) {
          console.log(`Правило б): tr для линии ${line.id} = ${endTr} / ${startLines.length} = ${newTr}`);
          line.tr = newTr;
          this.trValuesChanged = true;
        }
      });
    }
    // Правило в): минимум две линии концом и хотя бы одна линия началом
    else if (endLines.length >= 2 && startLines.length >= 1) {
      let sumTr = 0;
      endLines.forEach(info => {
        const line = info.line;
        sumTr += (line.tr || 100);
      });

      const newTr = sumTr / startLines.length;

      startLines.forEach(info => {
        const line = info.line;
        if (line.tr !== newTr) {
          console.log(`Правило в): tr для линии ${line.id} = ${sumTr} / ${startLines.length} = ${newTr}`);
          line.tr = newTr;
          this.trValuesChanged = true;
        }
      });
    }
    // Для линий, которые пересекаются серединой - tr не меняется
    // Для случаев, когда нет линий, приходящих началом - тоже ничего не меняем
  }

  // НОВЫЙ МЕТОД: Пересчитать все значения tr (с учетом airValue объектов)
  recalculateAllTrValues() {
    console.log('Начинаем пересчет всех значений tr с учетом airValue объектов...');
    this.trValuesChanged = false;

    // Сначала устанавливаем значения по умолчанию для линий без tr
    this.lines.forEach(line => {
      if (line.tr === undefined) {
        line.tr = 100;
      }
    });

    // Применяем правила для каждой точки пересечения (включая учет airValue объектов)
    // Делаем несколько итераций, так как изменения в одной точке могут повлиять на другую
    const maxIterations = 10;
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      console.log(`Итерация ${iteration + 1} пересчета tr`);
      this.trValuesChanged = false;

      this.intersectionPoints.forEach(point => {
        this.applyTrRuleAtIntersectionPoint(point);
      });

      if (!this.trValuesChanged) {
        console.log(`Значения tr стабилизировались после ${iteration + 1} итераций`);
        break;
      }
    }

    this.needsRedraw = true;
    this.redraw();
    console.log('Пересчет значений tr завершен');
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Обновить свойства линий
  updateLineTrackProperties() {
    // Очищаем существующие свойства
    this.lines.forEach(line => {
      line.track = [];
      line.endtrack = [];
      line.passability = {};
      // Устанавливаем tr по умолчанию, если не задано
      if (line.tr === undefined) {
        line.tr = 100;
      }
    });

    // Обновляем свойства на основе точек пересечения
    this.intersectionPoints.forEach(intersectionPoint => {
      intersectionPoint.intersections.forEach(intersection => {
        if (intersection.type === 'line-line') {
          const line1 = this.lines.find(l => l.id === intersection.line1Id);
          const line2 = this.lines.find(l => l.id === intersection.line2Id);

          this.updateLineProperties(line1, intersection.line1Endpoint, intersectionPoint);
          this.updateLineProperties(line2, intersection.line2Endpoint, intersectionPoint);
        } else if (intersection.type === 'line-object') {
          const line = this.lines.find(l => l.id === intersection.lineId);
          if (line) {
            this.updateLineProperties(line, intersection.lineEndpoint, intersectionPoint);
          }
        }
      });
    });

    // Для линий без пересечений
    this.lines.forEach(line => {
      if (Object.keys(line.passability).length === 0) {
        line.passability.default = 0;
      }
    });

    // Пересчитываем значения tr после обновления свойств
    this.recalculateAllTrValues();
  }

  setupEventListeners() {
    const events = [
      ['mousedown', (e) => this.handleMouseDown(e)],
      ['mousemove', (e) => this.handleMouseMove(e)],
      ['mouseup', () => this.handleMouseUp()],
      ['mouseout', () => this.handleMouseOut()],
      ['dblclick', (e) => this.handleDoubleClick(e)],
      ['click', (e) => this.handleClick(e)]
    ];

    events.forEach(([event, handler]) => {
      this.canvas.addEventListener(event, handler);
    });

    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    const container = this.canvas.parentElement;
    const width = container.clientWidth - 40;
    const height = container.clientHeight - 80;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.needsRedraw = true;
      this.redraw();
    }
  }

  setupUI() {
    this.setupModeButtons();
    this.setupColorButtons();
    this.setupCheckboxes();
    this.setupActionButtons();
    this.setupPropertyButtons();
    this.setupTrackPropertyButtons();
    this.setupTrPropertyButtons();
  }

  // НОВЫЙ МЕТОД: Настройка кнопок для работы с tr
  setupTrPropertyButtons() {
    const showTrInfo = document.getElementById('showTrInfo');
    if (showTrInfo) {
      showTrInfo.addEventListener('click', () => this.showLineTrInfo());
    }

    const recalculateTr = document.getElementById('recalculateTr');
    if (recalculateTr) {
      recalculateTr.addEventListener('click', () => {
        this.recalculateAllTrValues();
        alert('Значения tr пересчитаны согласно правилам');
      });
    }

    const exportTrData = document.getElementById('exportTrData');
    if (exportTrData) {
      exportTrData.addEventListener('click', () => this.exportTrData());
    }

    const toggleTrDisplay = document.getElementById('toggleTrDisplay');
    if (toggleTrDisplay) {
      toggleTrDisplay.addEventListener('click', () => {
        this.showTrValues = !this.showTrValues;
        toggleTrDisplay.textContent = this.showTrValues ?
          'Скрыть значения tr' : 'Показать значения tr';
        this.needsRedraw = true;
        this.redraw();
      });
    }
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Показать информацию о tr
  showLineTrInfo() {
    if (this.selectedElement && this.selectedElement.start && this.selectedElement.end) {
      const line = this.selectedElement;

      let message = `Информация о свойстве tr для линии (ID: ${line.id}):\n`;
      message += `Текущее значение tr: ${line.tr !== undefined ? line.tr.toFixed(2) : '100.00'}\n\n`;

      // Находим точки пересечения этой линии
      const pointInfo = [];
      this.intersectionPoints.forEach(point => {
        point.intersections.forEach(intersection => {
          let isLineInIntersection = false;
          let endpoint = null;
          let otherLineId = null;

          if (intersection.type === 'line-line') {
            if (intersection.line1Id === line.id) {
              isLineInIntersection = true;
              endpoint = intersection.line1Endpoint;
              otherLineId = intersection.line2Id;
            } else if (intersection.line2Id === line.id) {
              isLineInIntersection = true;
              endpoint = intersection.line2Endpoint;
              otherLineId = intersection.line1Id;
            }
          } else if (intersection.type === 'line-object') {
            if (intersection.lineId === line.id) {
              isLineInIntersection = true;
              endpoint = intersection.lineEndpoint;
            }
          }

          if (isLineInIntersection) {
            pointInfo.push({
              pointId: point.id,
              endpoint: endpoint,
              otherLineId: otherLineId,
              totalLinesInPoint: point.intersections.reduce((count, inter) => {
                if (inter.type === 'line-line') {
                  return count + 2;
                } else if (inter.type === 'line-object') {
                  return count + 1;
                }
                return count;
              }, 0),
              type: intersection.type
            });
          }
        });
      });

      if (pointInfo.length > 0) {
        message += `Точки пересечения:\n`;
        pointInfo.forEach(info => {
          message += `  • Точка #${info.pointId}: `;
          message += `линия подходит ${info.endpoint === 'start' ? 'началом' : info.endpoint === 'end' ? 'концом' : 'серединой'}\n`;

          // Показываем информацию о правиле
          const point = this.intersectionPoints.find(p => p.id === info.pointId);
          if (point) {
            const linesInfo = this.getLinesAtIntersectionPoint(point);
            message += `    Всего линий в точке: началом - ${linesInfo.startLines.length}, концом - ${linesInfo.endLines.length}\n`;

            // Проверяем, есть ли в точке объект с airValue
            let hasObjectWithAirValue = false;
            point.intersections.forEach(intersection => {
              if (intersection.type === 'line-object' && intersection.object && intersection.object.airValue) {
                hasObjectWithAirValue = true;
                message += `    В точке есть объект "${intersection.object.label}" с airValue = ${intersection.object.airValue}\n`;
              }
            });

            // Определяем примененное правило
            if (hasObjectWithAirValue && linesInfo.startLines.length > 0) {
              message += `    Применено правило: использован airValue объекта\n`;
            } else if (linesInfo.endLines.length === 1 && linesInfo.startLines.length === 1) {
              message += `    Применено правило а): одна линия концом и одна началом\n`;
            } else if (linesInfo.endLines.length === 1 && linesInfo.startLines.length > 1) {
              message += `    Применено правило б): одна линия концом и ${linesInfo.startLines.length} линий началом\n`;
            } else if (linesInfo.endLines.length >= 2 && linesInfo.startLines.length >= 1) {
              message += `    Применено правило в): ${linesInfo.endLines.length} линий концом и ${linesInfo.startLines.length} линий началом\n`;
            }
          }
        });
      } else {
        message += `Линия не имеет точек пересечения\n`;
      }

      console.log(message);
      alert(message);
    } else {
      alert('Выберите линию для просмотра информации о свойстве tr');
    }
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Экспорт данных о tr
  exportTrData() {
    const trData = this.lines.map(line => {
      // Находим точки пересечения для этой линии
      const pointInfo = [];
      this.intersectionPoints.forEach(point => {
        point.intersections.forEach(intersection => {
          if (intersection.type === 'line-line' &&
            (intersection.line1Id === line.id || intersection.line2Id === line.id)) {
            pointInfo.push({
              pointId: point.id,
              endpoint: intersection.line1Id === line.id ?
                intersection.line1Endpoint : intersection.line2Endpoint,
              x: point.x,
              y: point.y
            });
          } else if (intersection.type === 'line-object' && intersection.lineId === line.id) {
            pointInfo.push({
              pointId: point.id,
              endpoint: intersection.lineEndpoint,
              x: point.x,
              y: point.y,
              objectInfo: {
                id: intersection.object.id,
                label: intersection.object.label,
                type: intersection.object.type,
                airValue: intersection.object.airValue
              }
            });
          }
        });
      });

      return {
        lineId: line.id,
        start: line.start,
        end: line.end,
        tr: line.tr || 100,
        length: this.calculateLineLength(line).toFixed(1),
        intersectionPoints: pointInfo,
        properties: {
          cheight: line.cheight,
          cwidth: line.cwidth,
          cvolume: line.cvolume
        }
      };
    });

    const json = JSON.stringify({
      lines: trData,
      totalLines: this.lines.length,
      totalIntersections: this.intersectionPoints.length,
      calculationRules: {
        rule_with_object: "Если в точке есть объект с airValue, то для всех линий, выходящих из этой точки началом, tr устанавливается равным airValue объекта",
        rule_a: "Если в точку приходит одна линия концом и одна линия началом, то tr линии, которая пришла началом, становится равна tr линии, которая пришла концом",
        rule_b: "Если в точку приходит линия с концом и несколько линий с началом, то tr линии, которая пришла концом, делится на количество линий, пришедших началом",
        rule_c: "Если в точку приходит минимум две линии с концом, то их tr суммируются и делятся на количество линий, пришедших началом"
      }
    }, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tr_данные_с_расчетом.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Данные о tr экспортированы:', trData);
    alert('Данные о свойстве tr экспортированы в файл "tr_данные_с_расчетом.json"');
  }

  setupModeButtons() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setMode(e.target.dataset.mode);
        this.currentObjectType = null;
        document.querySelectorAll('.object-item').forEach(item => {
          item.classList.remove('selected');
        });
        this.hidePropertiesPanel();
        this.hideLinePropertiesPanel();
      });
    });
  }

  setupColorButtons() {
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setColor(e.target.dataset.color);
      });
    });
  }

  setupCheckboxes() {
    const snapToGrid = document.getElementById('snapToGrid');
    if (snapToGrid) {
      snapToGrid.addEventListener('change', (e) => {
        this.snapToGrid = e.target.checked;
        this.needsRedraw = true;
        this.redraw();
      });
    }

    const snapToPoints = document.getElementById('snapToPoints');
    if (snapToPoints) {
      snapToPoints.addEventListener('change', (e) => {
        this.snapToPoints = e.target.checked;
      });
    }
  }

  setupActionButtons() {
    const actions = {
      'clearAll': () => this.clearAll(),
      'showAllLines': () => this.logAllLines(),
      'findIntersections': () => this.findIntersections(),
      'savePDF': () => this.saveAsPDF(),
      'clearIntersections': () => this.clearIntersections(),
      'toggleIntersections': () => this.toggleIntersections(),
      'showLineTrackInfo': () => this.showLineTrackInfoHandler(),
      'updateAllTrackProperties': () => this.updateLineTrackProperties(),
      'exportAllLinesData': () => this.exportAllLinesData(),
      'updatePassability': () => this.updatePassabilityForAllLines(),
      'showPassabilityInfo': () => this.showPassabilityInfoHandler(),
      'exportIntersections': () => this.exportIntersectionData(),
      'toggleEndpoints': () => this.toggleEndpoints()
    };

    Object.entries(actions).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('click', handler);
      }
    });

    const lineWidthInput = document.getElementById('lineWidth');
    if (lineWidthInput) {
      lineWidthInput.addEventListener('change', (e) => {
        this.lineWidth = parseInt(e.target.value) || 5;
        this.needsRedraw = true;
        this.redraw();
      });
    }
  }

  setupPropertyButtons() {
    const applyProperties = document.getElementById('applyProperties');
    if (applyProperties) {
      applyProperties.addEventListener('click', () => this.applyObjectProperties());
    }

    const cancelProperties = document.getElementById('cancelProperties');
    if (cancelProperties) {
      cancelProperties.addEventListener('click', () => this.hidePropertiesPanel());
    }

    const rotateButton = document.getElementById('rotateButton');
    if (rotateButton) {
      rotateButton.addEventListener('click', () => this.rotateSelectedObject());
    }

    const applyLineProperties = document.getElementById('applyLineProperties');
    if (applyLineProperties) {
      applyLineProperties.addEventListener('click', () => this.applyLineProperties());
    }

    const cancelLineProperties = document.getElementById('cancelLineProperties');
    if (cancelLineProperties) {
      cancelLineProperties.addEventListener('click', () => this.hideLinePropertiesPanel());
    }

    const showLineProperties = document.getElementById('showLineProperties');
    if (showLineProperties) {
      showLineProperties.addEventListener('click', () => this.showAllLinesProperties());
    }
  }

  setupTrackPropertyButtons() {
    const toggleTrackProperties = document.getElementById('toggleTrackProperties');
    if (toggleTrackProperties) {
      toggleTrackProperties.addEventListener('click', () => {
        if (this.selectedElement) {
          if (this.selectedElement.start && this.selectedElement.end) {
            this.showLineTrackInfo(this.selectedElement);
          } else if (this.selectedElement.intersections) {
            this.showIntersectionInfo(this.selectedElement);
          } else if (this.selectedElement.type) {
            const objInfo = `Объект: ${this.selectedElement.label}\n` +
              `Тип: ${this.selectedElement.type}\n` +
              `Координаты: (${this.selectedElement.center.x.toFixed(1)}, ${this.selectedElement.center.y.toFixed(1)})\n` +
              `Размеры: ${this.selectedElement.width} x ${this.selectedElement.height}\n` +
              `Поворот: ${this.selectedElement.rotation}°\n` +
              `airValue: ${this.selectedElement.airValue}`;
            alert(objInfo);
          }
        } else {
          alert('Ничего не выбрано. Выберите линию, объект или точку пересечения.');
        }
      });
    }

    const togglePropertiesDisplay = document.getElementById('togglePropertiesDisplay');
    if (togglePropertiesDisplay) {
      togglePropertiesDisplay.addEventListener('click', () => {
        this.showTrackProperties = !this.showTrackProperties;
        this.needsRedraw = true;
        this.redraw();
      });
    }
  }

  setupObjectLibrary() {
    const categories = document.querySelectorAll('.category-btn');
    categories.forEach(btn => {
      btn.addEventListener('click', (e) => {
        categories.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.showCategory(e.target.dataset.category);
      });
    });
    this.populateObjectLibrary();
  }

  populateObjectLibrary() {
    const objectsGrid = document.getElementById('objectsGrid');
    if (!objectsGrid) return;

    objectsGrid.innerHTML = '';
    const objectTypes = ObjectFactory.getObjectTypes();

    objectTypes.forEach(objInfo => {
      const objElement = document.createElement('div');
      objElement.className = 'object-item';
      objElement.dataset.type = objInfo.type;
      objElement.dataset.category = objInfo.category;

      objElement.innerHTML = `
                <div class="object-icon">
                    <img src="${objInfo.icon}" alt="..." title="${objInfo.name}"/>
                </div>
                <div class="object-name">${objInfo.name}</div>
            `;

      objElement.addEventListener('click', () => {
        document.querySelectorAll('.object-item').forEach(item => {
          item.classList.remove('selected');
        });
        objElement.classList.add('selected');
        this.currentObjectType = objInfo.type;
        this.setMode('draw');
      });

      objectsGrid.appendChild(objElement);
    });
  }

  showCategory(category) {
    const objects = document.querySelectorAll('.object-item');
    objects.forEach(obj => {
      obj.style.display = (category === 'all' || obj.dataset.category === category)
        ? 'flex'
        : 'none';
    });
  }

  setMode(mode) {
    this.mode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const currentMode = document.getElementById('currentMode');
    if (currentMode) {
      const modeTexts = {
        'draw': this.currentObjectType ? 'Добавление объектов' : 'Рисование линий',
        'move': 'Перемещение',
        'edit': 'Редактирование',
        'delete': 'Удаление'
      };
      currentMode.textContent = modeTexts[mode] || mode;
    }

    this.canvas.style.cursor = this.getCursorForMode(mode);
  }

  getCursorForMode(mode) {
    const cursors = {
      'draw': 'crosshair',
      'move': 'move',
      'edit': 'pointer',
      'delete': 'not-allowed'
    };
    return cursors[mode] || 'default';
  }

  setColor(color) {
    this.lineColor = color;
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const colorBtn = document.querySelector(`[data-color="${color}"]`);
    if (colorBtn) colorBtn.classList.add('active');

    const currentColor = document.getElementById('currentColor');
    if (currentColor) currentColor.textContent = color;
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    this.mousePos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };

    return this.mousePos;
  }

  snapPosition(x, y) {
    let snappedX = x;
    let snappedY = y;

    if (this.snapToGrid) {
      snappedX = Math.round(x / this.gridSize) * this.gridSize;
      snappedY = Math.round(y / this.gridSize) * this.gridSize;
    }

    if (this.snapToPoints) {
      const closestPoint = this.findClosestPoint(x, y, 15);
      if (closestPoint) {
        snappedX = closestPoint.x;
        snappedY = closestPoint.y;
      }
    }

    return { x: snappedX, y: snappedY };
  }

  findClosestPoint(x, y, maxDistance) {
    let closestDistance = maxDistance;
    let closestPoint = null;

    this.lines.forEach(line => {
      [line.start, line.end].forEach(point => {
        const distance = Math.hypot(point.x - x, point.y - y);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPoint = point;
        }
      });
    });

    this.objects.forEach(obj => {
      const center = obj.center;
      const distance = Math.hypot(center.x - x, center.y - y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = center;
      }
    });

    return closestPoint;
  }

  handleMouseDown(e) {
    const mousePos = this.getMousePos(e);
    const snappedPos = this.snapPosition(mousePos.x, mousePos.y);

    if (this.mode === 'draw' && this.currentObjectType) {
      this.addObject(this.currentObjectType, snappedPos.x, snappedPos.y);
      return;
    }

    switch (this.mode) {
      case 'draw':
        this.startDrawing(snappedPos);
        break;
      case 'move':
        this.startMoving(snappedPos);
        break;
      case 'edit':
        this.startEditing(snappedPos);
        break;
      case 'delete':
        this.deleteAtPosition(snappedPos);
        break;
    }
  }

  handleMouseMove(e) {
    const mousePos = this.getMousePos(e);
    const snappedPos = this.snapPosition(mousePos.x, mousePos.y);

    switch (this.mode) {
      case 'draw':
        this.continueDrawing(snappedPos);
        break;
      case 'move':
        this.continueMoving(snappedPos);
        break;
      case 'edit':
        this.continueEditing(snappedPos);
        break;
    }
  }

  handleMouseUp() {
    switch (this.mode) {
      case 'draw':
        this.finishDrawing();
        break;
      case 'move':
      case 'edit':
        this.finishInteraction();
        break;
    }
  }

  handleMouseOut() {
    if (this.mode === 'draw') this.finishDrawing();
  }

  handleDoubleClick(e) {
    if (this.mode !== 'edit') return;

    const mousePos = this.getMousePos(e);
    const snappedPos = this.snapPosition(mousePos.x, mousePos.y);
    const line = this.findLineAtPoint(snappedPos);

    if (line) this.startLengthEditing(line, snappedPos);
  }

  handleClick(e) {
    const mousePos = this.getMousePos(e);
    const clickedPoint = this.findIntersectionPointAtPosition(mousePos);

    if (clickedPoint) {
      this.showIntersectionInfo(clickedPoint);
      e.stopPropagation();
    }
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Начать рисование линии
  startDrawing(pos) {
    this.isDrawing = true;
    this.tempLine = {
      id: Date.now() + Math.random(),
      start: { ...pos },
      end: { ...pos },
      color: this.lineColor,
      width: this.lineWidth,
      cheight: this.cheight,
      cwidth: this.cwidth,
      cvolume: this.cvolume,
      track: [],
      endtrack: [],
      passability: {},
      tr: 100 // Начальное значение по умолчанию
    };
    this.lastDrawnTempLine = null;
    this.tempLineDrawn = false;
  }

  continueDrawing(pos) {
    if (!this.isDrawing || !this.tempLine) return;

    const dx = pos.x - this.tempLine.end.x;
    const dy = pos.y - this.tempLine.end.y;
    if (Math.hypot(dx, dy) < 1) return;

    this.tempLine.end = { ...pos };

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.drawTemporaryLine();
      this.animationFrameId = null;
    });
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Завершить рисование линии
  finishDrawing() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.isDrawing && this.tempLine) {
      const length = this.calculateLineLength(this.tempLine);

      if (length > 5) {
        const newLine = {
          ...this.tempLine,
          id: Date.now() + Math.random(),
          tr: 100 // Начальное значение по умолчанию
        };

        // Добавляем линию
        this.lines.push(newLine);

        // Проверяем пересечение с объектами
        this.checkLineObjectIntersections(newLine);

        // Разбиваем линии между собой
        const hasIntersections = this.splitAllIntersectingLines();

        if (hasIntersections) {
          console.log('Линии были разбиты после добавления новой линии');
        }

        // Обновляем свойства линий (включая пересчет tr с учетом airValue объектов)
        this.updateLineTrackProperties();

        this.needsRedraw = true;
        this.updateStats();
      }

      this.tempLine = null;
      this.lastDrawnTempLine = null;
      this.tempLineDrawn = false;
      this.isDrawing = false;
      this.redraw();
    }
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Проверка пересечения линии с объектами
  checkLineObjectIntersections(line) {
    const objectIntersections = [];

    // Проверяем пересечение с каждым объектом
    for (const obj of this.objects) {
      const intersection = this.getLineObjectIntersection(line, obj);
      if (intersection) {
        objectIntersections.push({
          point: intersection.point,
          object: obj,
          side: intersection.side
        });
      }
    }

    // Если есть пересечения, создаем точки пересечения
    if (objectIntersections.length > 0) {
      this.createObjectIntersectionPoints(line, objectIntersections);
    }
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Создание точек пересечения линии с объектами
  createObjectIntersectionPoints(line, intersections) {
    for (const intersection of intersections) {
      // Создаем точку пересечения
      const intersectionPoint = new IntersectionPoint(
        intersection.point.x,
        intersection.point.y
      );

      // Определяем, каким концом линия подходит к точке
      const lineEndpoint = this.getLineEndpointAtIntersection(
        line,
        intersection.point,
        intersectionPoint.id,
        5
      );

      // Добавляем информацию о пересечении
      intersectionPoint.intersections.push({
        type: 'line-object',
        line: line,
        object: intersection.object,
        lineEndpoint: lineEndpoint,
        objectSide: intersection.side,
        lineId: line.id,
        objectId: intersection.object.id
      });

      // Добавляем точку пересечения
      this.intersectionPoints.push(intersectionPoint);

      // Обновляем свойства линии
      if (lineEndpoint === 'start') {
        if (!line.track.includes(intersectionPoint.id)) {
          line.track.push(intersectionPoint.id);
        }
        line.passability[intersectionPoint.id] = 5;
      } else if (lineEndpoint === 'end') {
        if (!line.endtrack.includes(intersectionPoint.id)) {
          line.endtrack.push(intersectionPoint.id);
        }
        line.passability[intersectionPoint.id] = 10;
      } else {
        line.passability[intersectionPoint.id] = 0;
      }
    }

    // Пересчитываем значения tr с учетом airValue объектов
    this.recalculateAllTrValues();
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Найти пересечение линии с объектом
  getLineObjectIntersection(line, obj) {
    const sides = obj.getSides();

    for (const side of sides) {
      const intersection = this.getLineIntersection(
        line.start, line.end,
        side.start, side.end
      );

      if (intersection) {
        const isOnLine = this.isPointOnLineSegment(
          intersection, line.start, line.end, 3
        );
        const isOnSide = this.isPointOnLineSegment(
          intersection, side.start, side.end, 3
        );

        if (isOnLine && isOnSide) {
          return {
            point: intersection,
            side: side.sideIndex,
            vertices: [side.start, side.end]
          };
        }
      }
    }

    return null;
  }

  startMoving(pos) {
    this.selectedElement = this.findObjectAtPoint(pos) || this.findLineAtPoint(pos);

    if (this.selectedElement) {
      this.isMoving = true;
      const targetPoint = this.selectedElement.start ? this.selectedElement.start : this.selectedElement;
      this.dragOffset = {
        x: pos.x - targetPoint.x,
        y: pos.y - targetPoint.y
      };
      this.needsRedraw = true;
    }
  }

  continueMoving(pos) {
    if (!this.isMoving || !this.selectedElement) return;

    if (this.selectedElement.start && this.selectedElement.end) {
      const newStartX = pos.x - this.dragOffset.x;
      const newStartY = pos.y - this.dragOffset.y;
      const deltaX = newStartX - this.selectedElement.start.x;
      const deltaY = newStartY - this.selectedElement.start.y;

      this.selectedElement.start.x = newStartX;
      this.selectedElement.start.y = newStartY;
      this.selectedElement.end.x += deltaX;
      this.selectedElement.end.y += deltaY;
    } else {
      this.selectedElement.setPosition(
        pos.x - this.dragOffset.x,
        pos.y - this.dragOffset.y
      );
    }

    this.needsRedraw = true;
    this.redraw();
  }

  startEditing(pos) {
    this.selectedElement = this.findObjectAtPoint(pos);

    if (this.selectedElement) {
      this.showPropertiesPanel(this.selectedElement);
      return;
    }

    this.selectedElement = this.findLineAtPoint(pos);
    if (this.selectedElement) {
      const distToStart = this.distance(pos, this.selectedElement.start);
      const distToEnd = this.distance(pos, this.selectedElement.end);

      if (distToStart < 10 || distToEnd < 10) {
        this.isEditing = true;
        this.editingPoint = distToStart < distToEnd ? 'start' : 'end';
        const targetPoint = this.selectedElement[this.editingPoint];
        this.dragOffset = { x: pos.x - targetPoint.x, y: pos.y - targetPoint.y };
      } else {
        this.showLinePropertiesPanel(this.selectedElement);
      }
      return;
    }

    this.hidePropertiesPanel();
    this.hideLinePropertiesPanel();
  }

  continueEditing(pos) {
    if (!this.isEditing || !this.selectedElement || !this.editingPoint) return;

    const targetPoint = this.selectedElement[this.editingPoint];
    targetPoint.x = pos.x - this.dragOffset.x;
    targetPoint.y = pos.y - this.dragOffset.y;

    if (this.snapToGrid) {
      const snappedPos = this.snapPosition(targetPoint.x, targetPoint.y);
      targetPoint.x = snappedPos.x;
      targetPoint.y = snappedPos.y;
    }

    this.needsRedraw = true;
    this.redraw();
  }

  finishInteraction() {
    this.isMoving = false;
    this.isEditing = false;
    this.editingPoint = null;
    this.dragOffset = { x: 0, y: 0 };

    // После перемещения линии пересчитываем пересечения и tr (с учетом airValue объектов)
    this.findIntersections();
    this.recalculateAllTrValues();
  }

  deleteAtPosition(pos) {
    const objectToDelete = this.findObjectAtPoint(pos);
    if (objectToDelete) {
      this.objects = this.objects.filter(obj => obj !== objectToDelete);

      // Удаляем точки пересечения, связанные с этим объектом
      this.intersectionPoints = this.intersectionPoints.filter(point => {
        const hasObjectIntersection = point.intersections.some(
          intersection => intersection.type === 'line-object' &&
            intersection.objectId === objectToDelete.id
        );
        return !hasObjectIntersection;
      });

      // Обновляем свойства линий и пересчитываем tr (с учетом оставшихся объектов)
      this.updateLineTrackProperties();

      this.hidePropertiesPanel();
      this.needsRedraw = true;
      this.updateStats();
      this.redraw();
      return;
    }

    const lineToDelete = this.findLineAtPoint(pos);
    if (lineToDelete) {
      this.lines = this.lines.filter(line => line !== lineToDelete);

      // Удаляем точки пересечения, связанные с этой линией
      this.intersectionPoints = this.intersectionPoints.filter(point => {
        const hasLineIntersection = point.intersections.some(
          intersection => (intersection.type === 'line-line' &&
              (intersection.line1Id === lineToDelete.id ||
                intersection.line2Id === lineToDelete.id)) ||
            (intersection.type === 'line-object' &&
              intersection.lineId === lineToDelete.id)
        );
        return !hasLineIntersection;
      });

      // Пересчитываем значения tr с учетом оставшихся объектов
      this.recalculateAllTrValues();

      this.hideLinePropertiesPanel();
      this.needsRedraw = true;
      this.updateStats();
      this.redraw();
    }
  }

  findLineAtPoint(pos, tolerance = 10) {
    for (let line of this.lines) {
      if (this.distance(pos, line.start) < tolerance ||
        this.distance(pos, line.end) < tolerance ||
        this.isPointOnLine(pos, line, tolerance)) {
        return line;
      }
    }
    return null;
  }

  findObjectAtPoint(pos, tolerance = 5) {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (obj.isPointInside(pos.x, pos.y)) {
        return obj;
      }
    }
    return null;
  }

  findIntersectionPointAtPosition(pos, tolerance = 10) {
    for (let point of this.intersectionPoints) {
      if (this.distance(point, pos) < tolerance) {
        return point;
      }
    }
    return null;
  }

  distance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  calculateLineLength(line) {
    return this.distance(line.start, line.end);
  }

  isPointOnLine(point, line, tolerance = 10) {
    const { start, end } = line;
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = start.x;
      yy = start.y;
    } else if (param > 1) {
      xx = end.x;
      yy = end.y;
    } else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }

    return this.distance(point, { x: xx, y: yy }) < tolerance;
  }

  isPointOnLineSegment(point, lineStart, lineEnd, tolerance = 3) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const lineLength = Math.hypot(C, D);
    if (lineLength < 1) return false;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    const extendedParam = Math.max(0, Math.min(1, param));
    const xx = lineStart.x + extendedParam * C;
    const yy = lineStart.y + extendedParam * D;

    return this.distance(point, { x: xx, y: yy }) < tolerance;
  }

  getLineIntersection(p1, p2, p3, p4) {
    const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (Math.abs(denominator) < 0.0001) return null;

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

    if (ua >= -0.001 && ua <= 1.001 && ub >= -0.001 && ub <= 1.001) {
      return {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y)
      };
    }

    return null;
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Добавить объект с созданием точек пересечения
  addObject(type, x, y) {
    const obj = ObjectFactory.createObject(type, x, y);
    this.objects.push(obj);

    // Находим все линии, которые пересекаются с объектом
    const lineIntersections = [];

    for (const line of this.lines) {
      const intersection = this.getLineObjectIntersection(line, obj);
      if (intersection) {
        lineIntersections.push({
          line: line,
          intersection: intersection
        });
      }
    }

    // Создаем точки пересечения для каждой линии
    for (const item of lineIntersections) {
      const intersectionPoint = new IntersectionPoint(
        item.intersection.point.x,
        item.intersection.point.y
      );

      // Определяем, каким концом линия подходит к точке
      const lineEndpoint = this.getLineEndpointAtIntersection(
        item.line,
        item.intersection.point,
        intersectionPoint.id,
        5
      );

      // Добавляем информацию о пересечении
      intersectionPoint.intersections.push({
        type: 'line-object',
        line: item.line,
        object: obj,
        lineEndpoint: lineEndpoint,
        objectSide: item.intersection.side,
        lineId: item.line.id,
        objectId: obj.id
      });

      // Добавляем точку пересечения
      this.intersectionPoints.push(intersectionPoint);

      // Обновляем свойства линии
      if (lineEndpoint === 'start') {
        if (!item.line.track.includes(intersectionPoint.id)) {
          item.line.track.push(intersectionPoint.id);
        }
        item.line.passability[intersectionPoint.id] = 5;
      } else if (lineEndpoint === 'end') {
        if (!item.line.endtrack.includes(intersectionPoint.id)) {
          item.line.endtrack.push(intersectionPoint.id);
        }
        item.line.passability[intersectionPoint.id] = 10;
      } else {
        item.line.passability[intersectionPoint.id] = 0;
      }
    }

    // Разбиваем линии по точкам пересечения с объектом
    this.splitLinesWithObject(obj, lineIntersections);

    // Пересчитываем значения tr с учетом нового объекта и его airValue
    this.recalculateAllTrValues();

    this.needsRedraw = true;
    this.updateStats();
    this.redraw();

    if (obj instanceof ImageObject) {
      obj.onImageLoad = () => {
        this.needsRedraw = true;
        this.redraw();
      };
      if (obj.imageLoaded) {
        this.needsRedraw = true;
        this.redraw();
      }
    }
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Разбить линии по точкам пересечения с объектом
  splitLinesWithObject(obj, lineIntersections) {
    const splitPointsMap = new Map();

    // Собираем все точки пересечения
    for (const item of lineIntersections) {
      if (!splitPointsMap.has(item.line.id)) {
        splitPointsMap.set(item.line.id, []);
      }
      splitPointsMap.get(item.line.id).push(item.intersection.point);
    }

    // Разбиваем линии
    this.splitLinesByPoints(splitPointsMap);
  }

  findIntersections() {
    const allIntersectionPoints = [];

    // Поиск пересечений линий с линиями
    for (let i = 0; i < this.lines.length; i++) {
      for (let j = i + 1; j < this.lines.length; j++) {
        const intersection = this.getLineIntersection(
          this.lines[i].start, this.lines[i].end,
          this.lines[j].start, this.lines[j].end
        );

        if (intersection) {
          const isOnLine1 = this.isPointOnLineSegment(intersection, this.lines[i].start, this.lines[i].end, 3);
          const isOnLine2 = this.isPointOnLineSegment(intersection, this.lines[j].start, this.lines[j].end, 3);

          if (isOnLine1 && isOnLine2) {
            const intersectionPoint = new IntersectionPoint(intersection.x, intersection.y);

            const line1Endpoint = this.getLineEndpointAtIntersection(this.lines[i], intersection, intersectionPoint.id, 5);
            const line2Endpoint = this.getLineEndpointAtIntersection(this.lines[j], intersection, intersectionPoint.id, 5);

            intersectionPoint.intersections.push({
              type: 'line-line',
              line1: this.lines[i],
              line2: this.lines[j],
              line1Endpoint,
              line2Endpoint,
              line1Id: this.lines[i].id,
              line2Id: this.lines[j].id,
              line1HasTrack: line1Endpoint === 'start',
              line1HasEndtrack: line1Endpoint === 'end',
              line2HasTrack: line2Endpoint === 'start',
              line2HasEndtrack: line2Endpoint === 'end'
            });

            allIntersectionPoints.push(intersectionPoint);
          }
        }
      }
    }

    // Поиск пересечений линий с объектами
    for (const line of this.lines) {
      for (const obj of this.objects) {
        const intersection = this.getLineObjectIntersection(line, obj);
        if (intersection) {
          const isOnLine = this.isPointOnLineSegment(
            intersection.point, line.start, line.end, 3
          );

          if (isOnLine) {
            // Проверяем, есть ли уже такая точка пересечения
            let existingPoint = null;
            for (const point of allIntersectionPoints) {
              if (point.isNear(intersection.point, 5)) {
                existingPoint = point;
                break;
              }
            }

            if (!existingPoint) {
              existingPoint = new IntersectionPoint(intersection.point.x, intersection.point.y);
              allIntersectionPoints.push(existingPoint);
            }

            const lineEndpoint = this.getLineEndpointAtIntersection(
              line, intersection.point, existingPoint.id, 5
            );

            // Добавляем информацию о пересечении
            existingPoint.intersections.push({
              type: 'line-object',
              line: line,
              object: obj,
              lineEndpoint: lineEndpoint,
              objectSide: intersection.side,
              lineId: line.id,
              objectId: obj.id
            });
          }
        }
      }
    }

    this.intersectionPoints = this.mergeCloseIntersectionPoints(allIntersectionPoints);
    this.removeDuplicateIntersectionPoints();
    this.intersectionInfo = this.intersectionPoints.map(point => point.getInfo());

    // Обновляем свойства линий и пересчитываем tr с учетом airValue объектов
    this.updateLineTrackProperties();

    this.showIntersections = true;
    this.needsRedraw = true;
    this.redraw();

    return this.intersectionPoints;
  }

  getLineEndpointAtIntersection(line, intersectionPoint, intersectionId, tolerance = 5) {
    const distToStart = this.distance(intersectionPoint, line.start);
    const distToEnd = this.distance(intersectionPoint, line.end);

    if (!line.track) line.track = [];
    if (!line.endtrack) line.endtrack = [];
    if (!line.passability) line.passability = {};

    if (distToStart < tolerance && distToEnd < tolerance) {
      const endpoint = distToStart < distToEnd ? 'start' : 'end';
      if (endpoint === 'start') {
        if (!line.track.includes(intersectionId)) line.track.push(intersectionId);
        if (intersectionId) line.passability[intersectionId] = 5;
      } else {
        if (!line.endtrack.includes(intersectionId)) line.endtrack.push(intersectionId);
        if (intersectionId) line.passability[intersectionId] = 10;
      }
      return endpoint;
    } else if (distToStart < tolerance) {
      if (!line.track.includes(intersectionId)) line.track.push(intersectionId);
      if (intersectionId) line.passability[intersectionId] = 5;
      return 'start';
    } else if (distToEnd < tolerance) {
      if (!line.endtrack.includes(intersectionId)) line.endtrack.push(intersectionId);
      if (intersectionId) line.passability[intersectionId] = 10;
      return 'end';
    } else {
      if (intersectionId) line.passability[intersectionId] = 0;
      return 'middle';
    }
  }

  mergeCloseIntersectionPoints(allPoints) {
    const mergedPoints = [];
    const usedPoints = new Set();
    const sortedPoints = [...allPoints].sort((a, b) => a.x - b.x);

    for (let i = 0; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];
      if (usedPoints.has(point.id)) continue;

      const mergedPoint = new IntersectionPoint(point.x, point.y);
      mergedPoint.intersections.push(...point.intersections);
      usedPoints.add(point.id);

      for (let j = i + 1; j < sortedPoints.length; j++) {
        const otherPoint = sortedPoints[j];
        if (Math.abs(otherPoint.x - point.x) > 5) break;

        if (!usedPoints.has(otherPoint.id) && mergedPoint.isNear(otherPoint, 5)) {
          mergedPoint.intersections.push(...otherPoint.intersections);
          usedPoints.add(otherPoint.id);
          mergedPoint.x = (mergedPoint.x + otherPoint.x) / 2;
          mergedPoint.y = (mergedPoint.y + otherPoint.y) / 2;
        }
      }

      mergedPoints.push(mergedPoint);
    }

    console.log(`Объединено ${allPoints.length} точек в ${mergedPoints.length} точек`);
    return mergedPoints;
  }

  removeDuplicateIntersectionPoints() {
    const uniquePoints = [];
    const usedIds = new Set();

    for (const point of this.intersectionPoints) {
      if (usedIds.has(point.id)) continue;

      let isDuplicate = false;
      for (const uniquePoint of uniquePoints) {
        if (point.isNear(uniquePoint, 5)) {
          uniquePoint.intersections.push(...point.intersections);
          isDuplicate = true;
          usedIds.add(point.id);
          break;
        }
      }

      if (!isDuplicate) {
        uniquePoints.push(point);
        usedIds.add(point.id);
      }
    }

    this.intersectionPoints = uniquePoints;
  }

  splitAllIntersectingLines() {
    const splitPointsMap = new Map();

    // Собираем все точки пересечения линий
    for (let i = 0; i < this.lines.length; i++) {
      for (let j = i + 1; j < this.lines.length; j++) {
        const intersection = this.getLineIntersection(
          this.lines[i].start, this.lines[i].end,
          this.lines[j].start, this.lines[j].end
        );

        if (intersection) {
          const isOnLine1 = this.isPointOnLineSegment(intersection, this.lines[i].start, this.lines[i].end, 3);
          const isOnLine2 = this.isPointOnLineSegment(intersection, this.lines[j].start, this.lines[j].end, 3);

          if (isOnLine1 && isOnLine2) {
            this.addSplitPoint(splitPointsMap, this.lines[i].id, intersection);
            this.addSplitPoint(splitPointsMap, this.lines[j].id, intersection);
          }
        }
      }
    }

    // Собираем точки пересечения линий с объектами
    for (const line of this.lines) {
      for (const obj of this.objects) {
        const intersection = this.getLineObjectIntersection(line, obj);
        if (intersection) {
          const isOnLine = this.isPointOnLineSegment(
            intersection.point, line.start, line.end, 3
          );
          if (isOnLine) {
            this.addSplitPoint(splitPointsMap, line.id, intersection.point);
          }
        }
      }
    }

    return this.splitLinesByPoints(splitPointsMap);
  }

  addSplitPoint(map, lineId, point) {
    if (!map.has(lineId)) map.set(lineId, []);
    const points = map.get(lineId);

    let exists = false;
    for (const existingPoint of points) {
      if (this.distance(existingPoint, point) < 5) {
        exists = true;
        break;
      }
    }

    if (!exists) points.push({ ...point });
  }

  splitLinesByPoints(splitPointsMap) {
    const newLines = [];
    const processedLineIds = new Set();

    for (const line of this.lines) {
      if (!splitPointsMap.has(line.id) || splitPointsMap.get(line.id).length === 0) {
        if (!processedLineIds.has(line.id)) {
          newLines.push(line);
          processedLineIds.add(line.id);
        }
        continue;
      }

      const points = splitPointsMap.get(line.id);
      const allPoints = [
        { x: line.start.x, y: line.start.y, isEndpoint: true },
        ...points.map(p => ({ x: p.x, y: p.y, isEndpoint: false })),
        { x: line.end.x, y: line.end.y, isEndpoint: true }
      ];

      // Сортируем точки по расстоянию от начала
      allPoints.sort((a, b) => {
        return this.distance(a, line.start) - this.distance(b, line.start);
      });

      // Удаляем дубликаты
      const uniquePoints = this.removeDuplicatePoints(allPoints);

      // Создаём отрезки
      for (let i = 0; i < uniquePoints.length - 1; i++) {
        const segmentLength = this.distance(uniquePoints[i], uniquePoints[i + 1]);
        if (segmentLength > 5) {
          const newLine = {
            ...line,
            id: Date.now() + Math.random() + i,
            start: { x: uniquePoints[i].x, y: uniquePoints[i].y },
            end: { x: uniquePoints[i + 1].x, y: uniquePoints[i + 1].y },
            track: [],
            endtrack: [],
            passability: {},
            tr: line.tr || 100 // Сохраняем tr исходной линии
          };
          newLines.push(newLine);
        }
      }

      processedLineIds.add(line.id);
    }

    this.lines = newLines;
    return splitPointsMap.size > 0;
  }

  removeDuplicatePoints(points) {
    const uniquePoints = [];
    for (const point of points) {
      let isDuplicate = false;
      for (const uniquePoint of uniquePoints) {
        if (this.distance(point, uniquePoint) < 5) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) uniquePoints.push(point);
    }
    return uniquePoints;
  }

  updateLineProperties(line, endpoint, intersectionPoint) {
    if (!line) return;

    if (endpoint === 'start') {
      if (!line.track.includes(intersectionPoint.id)) {
        line.track.push(intersectionPoint.id);
      }
      line.passability[intersectionPoint.id] = 5;
    } else if (endpoint === 'end') {
      if (!line.endtrack.includes(intersectionPoint.id)) {
        line.endtrack.push(intersectionPoint.id);
      }
      line.passability[intersectionPoint.id] = 10;
    } else {
      line.passability[intersectionPoint.id] = 0;
    }
  }

  updatePassabilityForAllLines() {
    this.lines.forEach(line => {
      if (!line.passability) line.passability = {};
      line.passability = {};

      this.intersectionPoints.forEach(point => {
        point.intersections.forEach(intersection => {
          if (intersection.type === 'line-line') {
            if (intersection.line1Id === line.id) {
              let lineEndpoint = intersection.line1Endpoint;
              if (lineEndpoint === 'start') {
                line.passability[point.id] = 5;
              } else if (lineEndpoint === 'end') {
                line.passability[point.id] = 10;
              } else if (lineEndpoint === 'middle') {
                line.passability[point.id] = 0;
              }
            } else if (intersection.line2Id === line.id) {
              let lineEndpoint = intersection.line2Endpoint;
              if (lineEndpoint === 'start') {
                line.passability[point.id] = 5;
              } else if (lineEndpoint === 'end') {
                line.passability[point.id] = 10;
              } else if (lineEndpoint === 'middle') {
                line.passability[point.id] = 0;
              }
            }
          } else if (intersection.type === 'line-object' && intersection.lineId === line.id) {
            let lineEndpoint = intersection.lineEndpoint;
            if (lineEndpoint === 'start') {
              line.passability[point.id] = 5;
            } else if (lineEndpoint === 'end') {
              line.passability[point.id] = 10;
            } else if (lineEndpoint === 'middle') {
              line.passability[point.id] = 0;
            }
          }
        });
      });

      if (Object.keys(line.passability).length === 0) {
        line.passability.default = 0;
      }
    });

    // Пересчитываем значения tr с учетом airValue объектов
    this.recalculateAllTrValues();
  }

  getLinePassabilityAtPoint(line, pointId) {
    if (!line.passability) {
      this.updatePassabilityForLine(line);
    }
    return line.passability[pointId] || line.passability.default || 0;
  }

  getLineTotalPassability(line) {
    if (!line.passability) {
      this.updatePassabilityForLine(line);
    }
    return Object.values(line.passability).reduce((sum, value) => sum + value, 0);
  }

  updatePassabilityForLine(line) {
    if (!line.passability) line.passability = {};
    line.passability = {};

    this.intersectionPoints.forEach(point => {
      point.intersections.forEach(intersection => {
        if (intersection.type === 'line-line') {
          if (intersection.line1Id === line.id) {
            line.passability[point.id] = intersection.line1Endpoint === 'start' ? 5 :
              intersection.line1Endpoint === 'end' ? 10 : 0;
          } else if (intersection.line2Id === line.id) {
            line.passability[point.id] = intersection.line2Endpoint === 'start' ? 5 :
              intersection.line2Endpoint === 'end' ? 10 : 0;
          }
        } else if (intersection.type === 'line-object' && intersection.lineId === line.id) {
          line.passability[point.id] = intersection.lineEndpoint === 'start' ? 5 :
            intersection.lineEndpoint === 'end' ? 10 : 0;
        }
      });
    });

    if (Object.keys(line.passability).length === 0) {
      line.passability.default = 0;
    }

    return line.passability;
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Отрисовка свойств линии
  drawLineProperties(line, ctx = this.ctx) {
    if (!this.showTrValues) return;

    const midPoint = {
      x: (line.start.x + line.end.x) / 2,
      y: (line.start.y + line.end.y) / 2
    };

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'red';
    ctx.font = 'bold 12px Arial';

    // Показываем значение tr
    if (line.tr !== undefined) {
      ctx.fillText(`tr: ${line.tr.toFixed(1)}`, midPoint.x, midPoint.y + 20);
    }

    ctx.restore();
  }

  redraw() {
    const ctx = this.ctx;
    const bufferCtx = this.bufferCtx;

    if (this.bufferCanvas.width !== this.canvas.width || this.bufferCanvas.height !== this.canvas.height) {
      this.bufferCanvas.width = this.canvas.width;
      this.bufferCanvas.height = this.canvas.height;
      this.needsRedraw = true;
    }

    if (this.needsRedraw) {
      bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

      if (this.snapToGrid) this.drawGrid(bufferCtx);

      this.lines.forEach(line => {
        this.drawLine(line, bufferCtx);
        this.drawLengthInfo(line, bufferCtx);
        // Отрисовываем свойства линии, включая tr
        this.drawLineProperties(line, bufferCtx);
      });

      if (this.showEndpoints) {
        this.drawAllLineEndpoints(bufferCtx);
      }

      this.objects.forEach(obj => obj.draw(bufferCtx));

      if (this.showIntersections && this.intersectionPoints.length > 0) {
        this.drawIntersectionPoints(bufferCtx);
      }

      this.needsRedraw = false;
    }

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.bufferCanvas, 0, 0);

    if (this.showTrackProperties) {
      this.drawTrackProperties(ctx);
      this.drawPassabilityProperties(ctx);
    }

    if (this.tempLine) {
      this.drawTemporaryLine();
    } else if (this.selectedElement) {
      this.highlightElement(this.selectedElement, ctx);
    }

    if (this.selectedElement && this.selectedElement.start && this.selectedElement.end) {
      this.drawSelectedLineEndpoints(ctx);
    }
  }

  drawAllLineEndpoints(ctx = this.ctx) {
    if (!this.showEndpoints) return;

    this.lines.forEach(line => {
      this.drawStartEndpointMarker(ctx, line.start);
      this.drawEndEndpointMarker(ctx, line.end);
    });
  }

  drawStartEndpointMarker(ctx, point) {
    if (!point || typeof point.x === 'undefined' || typeof point.y === 'undefined') return;

    ctx.save();
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('С', point.x, point.y);
    ctx.restore();
  }

  drawEndEndpointMarker(ctx, point) {
    if (!point || typeof point.x === 'undefined' || typeof point.y === 'undefined') return;

    ctx.save();
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('К', point.x, point.y);
    ctx.restore();
  }

  drawSelectedLineEndpoints(ctx) {
    if (!this.selectedElement || !this.selectedElement.start || !this.selectedElement.end) return;

    ctx.save();

    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(this.selectedElement.start.x, this.selectedElement.start.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('С', this.selectedElement.start.x, this.selectedElement.start.y);

    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(this.selectedElement.end.x, this.selectedElement.end.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('К', this.selectedElement.end.x, this.selectedElement.end.y);

    ctx.restore();
  }

  drawTemporaryLine() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.bufferCanvas, 0, 0);

    if (this.tempLine) {
      this.ctx.save();

      const dx = this.tempLine.end.x - this.tempLine.start.x;
      const dy = this.tempLine.end.y - this.tempLine.start.y;
      const length = Math.hypot(dx, dy);

      if (length > 0) {
        const angle = Math.atan2(dy, dx);
        const lineWidth = this.tempLine.width || 5;

        this.ctx.translate(this.tempLine.start.x, this.tempLine.start.y);
        this.ctx.rotate(angle);

        this.ctx.fillStyle = 'rgba(128, 128, 128, 0.2)';
        this.ctx.fillRect(0, -lineWidth / 2, length, lineWidth);

        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, -lineWidth / 2, length, lineWidth);
      }

      this.ctx.restore();

      this.drawStartEndpointMarker(this.ctx, this.tempLine.start);
      this.drawEndEndpointMarker(this.ctx, this.tempLine.end);

      const midPoint = {
        x: (this.tempLine.start.x + this.tempLine.end.x) / 2,
        y: (this.tempLine.start.y + this.tempLine.end.y) / 2
      };
      const realLength = this.calculateLineLength(this.tempLine);

      this.ctx.save();
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = 'red';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(`${realLength.toFixed(1)}m`, midPoint.x, midPoint.y - 15);
      this.ctx.restore();
    }

    if (this.selectedElement) {
      this.highlightElement(this.selectedElement, this.ctx);
    }
  }

  drawGrid(ctx = this.ctx) {
    ctx.save();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawLine(line, ctx = this.ctx) {
    ctx.save();

    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const length = Math.hypot(dx, dy);

    if (length === 0) {
      ctx.restore();
      return;
    }

    const angle = Math.atan2(dy, dx);
    const lineWidth = line.width || this.lineWidth || 5;

    ctx.translate(line.start.x, line.start.y);
    ctx.rotate(angle);

    ctx.fillStyle = line.color;
    ctx.fillRect(0, -lineWidth / 2, length, lineWidth);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, -lineWidth / 2, length, lineWidth);

    ctx.restore();
  }

  drawLengthInfo(line, ctx = this.ctx) {
    const midPoint = {
      x: (line.start.x + line.end.x) / 2,
      y: (line.start.y + line.end.y) / 2
    };

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lengthText = line.customLength !== undefined ?
      `${line.customLength}m` :
      `${this.calculateLineLength(line).toFixed(1)}m`;

    ctx.fillStyle = line.customLength !== undefined ? 'red' : 'black';
    ctx.font = line.customLength !== undefined ? 'bold 12px Arial' : '12px Arial';
    ctx.fillText(lengthText, midPoint.x, midPoint.y - 15);

    ctx.restore();
  }

  drawIntersectionPoints(ctx = this.ctx) {
    this.intersectionPoints.forEach(point => {
      ctx.save();

      const isSelected = this.selectedElement && this.selectedElement.id === point.id;

      let fillColor;
      const hasLineObject = point.intersections.some(i => i.type === 'line-object');
      const hasLineLine = point.intersections.some(i => i.type === 'line-line');

      if (isSelected) {
        fillColor = 'rgba(0, 255, 0, 0.9)';
      } else if (hasLineObject && hasLineLine) {
        fillColor = 'rgba(255, 0, 255, 0.8)';
      } else if (hasLineObject) {
        fillColor = 'rgba(0, 0, 255, 0.8)';
      } else if (hasLineLine) {
        fillColor = 'rgba(255, 165, 0, 0.8)';
      } else {
        fillColor = 'rgba(255, 0, 0, 0.8)';
      }

      ctx.beginPath();
      ctx.arc(point.x, point.y, isSelected ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = 'blue';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';

      let label = `${point.id}`;
      if (point.intersections.length >= 1) {
        label += ` (${point.intersections.length})`;
      }

      ctx.fillText(label, point.x + 10, point.y - (isSelected ? 12 : 8));
      ctx.restore();
    });
  }

  drawTrackProperties(ctx = this.ctx) {
    if (!this.showTrackProperties) return;

    this.lines.forEach(line => {
      if (line.track && line.track.length > 0) {
        line.track.forEach(trackId => {
          const point = this.intersectionPoints.find(p => p.id === trackId);
          if (point) this.drawTrackMarker(ctx, point, 'T', 'rgba(0, 255, 0, 0.7)');
        });
      }

      if (line.endtrack && line.endtrack.length > 0) {
        line.endtrack.forEach(endtrackId => {
          const point = this.intersectionPoints.find(p => p.id === endtrackId);
          if (point) this.drawTrackMarker(ctx, point, 'E', 'rgba(255, 0, 0, 0.7)');
        });
      }
    });
  }

  drawTrackMarker(ctx, point, text, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, point.x, point.y);
    ctx.restore();
  }

  drawPassabilityProperties(ctx = this.ctx) {
    if (!this.showTrackProperties) return;

    this.lines.forEach(line => {
      if (line.passability) {
        Object.entries(line.passability).forEach(([pointId, value]) => {
          if (pointId === 'default') return;

          const point = this.intersectionPoints.find(p => p.id == pointId);
          if (point) {
            ctx.save();

            let color;
            if (value === 5) {
              color = 'rgba(0, 255, 0, 0.7)';
            } else if (value === 10) {
              color = 'rgba(255, 0, 0, 0.7)';
            } else {
              color = 'rgba(255, 255, 0, 0.7)';
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toString(), point.x, point.y);

            ctx.restore();
          }
        });
      }
    });
  }

  highlightElement(element, ctx = this.ctx) {
    ctx.save();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (element.start && element.end) {
      const bounds = this.getLineBounds(element);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(element.start.x, element.start.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(element.end.x, element.end.y, 10, 0, 2 * Math.PI);
      ctx.fill();
    } else if (element.x !== undefined && element.y !== undefined) {
      ctx.strokeRect(
        element.x - 5, element.y - 5,
        (element.width || 0) + 10,
        (element.height || 0) + 10
      );
    }

    ctx.restore();
  }

  getLineBounds(line) {
    const minX = Math.min(line.start.x, line.end.x);
    const minY = Math.min(line.start.y, line.end.y);
    const maxX = Math.max(line.start.x, line.end.x);
    const maxY = Math.max(line.start.y, line.end.y);

    return {
      x: minX - 10,
      y: minY - 10,
      width: maxX - minX + 20,
      height: maxY - minY + 20
    };
  }

  startLengthEditing(line, pos) {
    this.editingLength = true;
    this.selectedElement = line;

    if (this.lengthEditOverlay) {
      document.body.removeChild(this.lengthEditOverlay);
    }

    this.lengthEditOverlay = document.createElement('div');
    this.lengthEditOverlay.className = 'length-edit-overlay';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = line.customLength || '';
    input.placeholder = 'Длина в m';

    const button = document.createElement('button');
    button.textContent = 'OK';

    const rect = this.canvas.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageXOffset || document.documentElement.scrollTop;

    this.lengthEditOverlay.style.left = (rect.left + pos.x + scrollX) + 'px';
    this.lengthEditOverlay.style.top = (rect.top + pos.y + scrollY) + 'px';

    this.lengthEditOverlay.appendChild(input);
    this.lengthEditOverlay.appendChild(button);
    document.body.appendChild(this.lengthEditOverlay);

    input.focus();
    input.select();

    const applyLength = () => {
      const newLength = input.value.trim();
      if (newLength && !isNaN(newLength)) {
        line.customLength = Number(newLength);
      } else {
        delete line.customLength;
      }
      this.needsRedraw = true;
      this.redraw();
      this.finishLengthEditing();
    };

    const cancelLength = () => {
      this.finishLengthEditing();
    };

    button.addEventListener('click', applyLength);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyLength();
      else if (e.key === 'Escape') cancelLength();
    });

    setTimeout(() => {
      const closeHandler = (e) => {
        if (this.lengthEditOverlay && !this.lengthEditOverlay.contains(e.target)) {
          this.finishLengthEditing();
          document.removeEventListener('mousedown', closeHandler);
        }
      };
      document.addEventListener('mousedown', closeHandler);
    }, 100);
  }

  finishLengthEditing() {
    this.editingLength = false;
    if (this.lengthEditOverlay) {
      document.body.removeChild(this.lengthEditOverlay);
      this.lengthEditOverlay = null;
    }
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Показать панель свойств объекта (с полем airValue)
  showPropertiesPanel(obj) {
    const panel = document.getElementById('propertiesPanel');
    const labelInput = document.getElementById('propertyLabel');
    const widthInput = document.getElementById('propertyWidth');
    const heightInput = document.getElementById('propertyHeight');
    const airValueInput = document.getElementById('propertyAirValue');

    if (!panel || !labelInput || !widthInput || !heightInput || !airValueInput) return;

    labelInput.value = obj.label;
    widthInput.value = obj.width;
    heightInput.value = obj.height;
    airValueInput.value = obj.airValue || 0;
    panel.style.display = 'block';
  }

  hidePropertiesPanel() {
    const panel = document.getElementById('propertiesPanel');
    if (panel) panel.style.display = 'none';
    this.selectedElement = null;
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Показать панель свойств линии
  showLinePropertiesPanel(line) {
    const panel = document.getElementById('linePropertiesPanel');
    const cheightInput = document.getElementById('lineCheight');
    const cwidthInput = document.getElementById('lineCwidth');
    const cvolumeInput = document.getElementById('lineCvolume');
    const lengthInput = document.getElementById('lineLength');
    const trInput = document.getElementById('lineTr');

    if (!panel || !cheightInput || !cwidthInput || !cvolumeInput || !lengthInput) return;

    cheightInput.value = line.cheight || '';
    cwidthInput.value = line.cwidth || '';
    cvolumeInput.value = line.cvolume || '';
    lengthInput.value = `${this.calculateLineLength(line).toFixed(1)}m`;

    // Поле для tr всегда доступно для редактирования
    if (trInput) {
      trInput.value = line.tr !== undefined ? line.tr.toFixed(2) : '100.00';
      trInput.disabled = false;
    }

    panel.style.display = 'block';
  }

  hideLinePropertiesPanel() {
    const panel = document.getElementById('linePropertiesPanel');
    if (panel) panel.style.display = 'none';
    this.selectedElement = null;
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Применить свойства объекта (включая airValue)
  applyObjectProperties() {
    if (!this.selectedElement) return;

    const labelInput = document.getElementById('propertyLabel');
    const widthInput = document.getElementById('propertyWidth');
    const heightInput = document.getElementById('propertyHeight');
    const airValueInput = document.getElementById('propertyAirValue');

    if (!labelInput || !widthInput || !heightInput || !airValueInput) return;

    this.selectedElement.setLabel(labelInput.value);
    this.selectedElement.setSize(parseInt(widthInput.value), parseInt(heightInput.value));
    this.selectedElement.setAirValue(airValueInput.value);

    // При изменении airValue объекта пересчитываем tr для всех связанных линий
    this.recalculateAllTrValues();

    this.needsRedraw = true;
    this.redraw();
  }

  // МОДИФИЦИРОВАННЫЙ МЕТОД: Применить свойства линии
  applyLineProperties() {
    if (!this.selectedElement || !this.selectedElement.start) return;

    const cheightInput = document.getElementById('lineCheight');
    const cwidthInput = document.getElementById('lineCwidth');
    const cvolumeInput = document.getElementById('lineCvolume');
    const trInput = document.getElementById('lineTr');

    if (!cheightInput || !cwidthInput || !cvolumeInput) return;

    this.selectedElement.cheight = cheightInput.value ? parseFloat(cheightInput.value) : null;
    this.selectedElement.cwidth = cwidthInput.value ? parseFloat(cwidthInput.value) : null;
    this.selectedElement.cvolume = cvolumeInput.value ? parseFloat(cvolumeInput.value) : null;

    // Обновляем tr вручную
    if (trInput && trInput.value) {
      const newTr = parseFloat(trInput.value);
      if (!isNaN(newTr)) {
        this.selectedElement.tr = newTr;
        // Пересчитываем все значения tr после ручного изменения
        this.recalculateAllTrValues();
      }
    }

    this.needsRedraw = true;
    this.redraw();
    this.hideLinePropertiesPanel();
  }

  rotateSelectedObject() {
    if (!this.selectedElement) return;
    this.selectedElement.rotate(90);
    this.needsRedraw = true;
    this.redraw();
  }

  showIntersectionInfo(point) {
    let message = `Точка пересечения #${point.id}\n`;
    message += `Координаты: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})\n`;
    message += `Количество пересечений в точке: ${point.intersections.length}\n\n`;

    if (point.intersections.length > 0) {
      message += "Детали пересечений:\n";

      // Получаем информацию о линиях в точке
      const linesInfo = this.getLinesAtIntersectionPoint(point);

      message += `Линий приходит началом: ${linesInfo.startLines.length}\n`;
      message += `Линий приходит концом: ${linesInfo.endLines.length}\n`;
      message += `Линий пересекается серединой: ${linesInfo.middleLines.length}\n\n`;

      // Проверяем, есть ли в точке объект с airValue
      let hasObjectWithAirValue = false;
      let objectAirValue = null;
      point.intersections.forEach(intersection => {
        if (intersection.type === 'line-object' && intersection.object && intersection.object.airValue) {
          hasObjectWithAirValue = true;
          objectAirValue = intersection.object.airValue;
          message += `В точке есть объект "${intersection.object.label}" с airValue = ${objectAirValue}\n`;
        }
      });

      message += "\nПримененные правила для tr:\n";

      // Определяем примененные правила
      if (hasObjectWithAirValue && linesInfo.startLines.length > 0) {
        message += `• Использован airValue объекта: ${objectAirValue}\n`;
        message += `  Для всех линий, выходящих началом из этой точки, tr установлен = ${objectAirValue}\n`;
      } else if (linesInfo.endLines.length === 1 && linesInfo.startLines.length === 1) {
        message += `• Правило а): одна линия концом и одна линия началом\n`;
        const endLine = linesInfo.endLines[0].line;
        const startLine = linesInfo.startLines[0].line;
        message += `  tr(конец): ${endLine.tr.toFixed(2)} -> tr(начало): ${startLine.tr.toFixed(2)}\n`;
      } else if (linesInfo.endLines.length === 1 && linesInfo.startLines.length > 1) {
        message += `• Правило б): одна линия концом и ${linesInfo.startLines.length} линий началом\n`;
        const endLine = linesInfo.endLines[0].line;
        message += `  tr(конец): ${endLine.tr.toFixed(2)} / ${linesInfo.startLines.length} = ${(endLine.tr / linesInfo.startLines.length).toFixed(2)}\n`;
      } else if (linesInfo.endLines.length >= 2 && linesInfo.startLines.length >= 1) {
        message += `• Правило в): ${linesInfo.endLines.length} линий концом и ${linesInfo.startLines.length} линий началом\n`;
        let sumTr = 0;
        linesInfo.endLines.forEach(info => {
          sumTr += info.line.tr || 100;
        });
        message += `  Сумма tr(концов): ${sumTr.toFixed(2)} / ${linesInfo.startLines.length} = ${(sumTr / linesInfo.startLines.length).toFixed(2)}\n`;
      }

      point.intersections.forEach((intersection, index) => {
        message += `\nПересечение ${index + 1}:\n`;

        if (intersection.type === 'line-line') {
          message += this.formatLineLineIntersection(intersection, point);
        } else if (intersection.type === 'line-object') {
          message += this.formatLineObjectIntersection(intersection, point);
        }
      });
    } else {
      message += "Нет деталей о пересечениях";
    }

    this.showInfoModal(message, point);
  }

  formatLineLineIntersection(intersection, point) {
    let message = `  Тип: Линия с линией\n`;
    message += `  Линия 1 (ID: ${intersection.line1Id || 'нет'}): `;
    message += `(${intersection.line1.start.x.toFixed(1)},${intersection.line1.start.y.toFixed(1)}) - `;
    message += `(${intersection.line1.end.x.toFixed(1)},${intersection.line1.end.y.toFixed(1)})\n`;

    message += this.formatEndpointInfo(intersection.line1Endpoint, 1);

    const line1 = this.lines.find(l => l.id === intersection.line1Id);
    if (line1 && line1.tr !== undefined) {
      message += `    Свойство tr: ${line1.tr.toFixed(2)}\n`;
    }

    message += `  Линия 2 (ID: ${intersection.line2Id || 'нет'}): `;
    message += `(${intersection.line2.start.x.toFixed(1)},${intersection.line2.start.y.toFixed(1)}) - `;
    message += `(${intersection.line2.end.x.toFixed(1)},${intersection.line2.end.y.toFixed(1)})\n`;

    message += this.formatEndpointInfo(intersection.line2Endpoint, 2);

    const line2 = this.lines.find(l => l.id === intersection.line2Id);
    if (line2 && line2.tr !== undefined) {
      message += `    Свойство tr: ${line2.tr.toFixed(2)}\n`;
    }

    return message;
  }

  formatLineObjectIntersection(intersection, point) {
    let message = `  Тип: Линия с объектом\n`;
    message += `  Линия (ID: ${intersection.lineId || 'нет'}): `;
    message += `(${intersection.line.start.x.toFixed(1)},${intersection.line.start.y.toFixed(1)}) - `;
    message += `(${intersection.line.end.x.toFixed(1)},${intersection.line.end.y.toFixed(1)})\n`;

    message += this.formatEndpointInfo(intersection.lineEndpoint, 1);

    const line = this.lines.find(l => l.id === intersection.lineId);
    if (line && line.tr !== undefined) {
      message += `    Свойство tr: ${line.tr.toFixed(2)}\n`;
    }

    message += `  Объект: ${intersection.object.label}\n`;
    message += `  Тип объекта: ${intersection.object.type}\n`;
    message += `  airValue объекта: ${intersection.object.airValue}\n`;
    message += `  Сторона объекта: ${intersection.objectSide}\n`;

    return message;
  }

  formatEndpointInfo(endpoint, lineNumber) {
    switch (endpoint) {
      case 'start':
        return `    Линия ${lineNumber} подходит НАЧАЛОМ к точке\n`;
      case 'end':
        return `    Линия ${lineNumber} подходит КОНЦОМ к точке\n`;
      case 'middle':
        return `    Точка в СЕРЕДИНЕ линии ${lineNumber}\n`;
      default:
        return `    Неизвестно каким концом (линия ${lineNumber})\n`;
    }
  }

  showInfoModal(message, point) {
    const modal = document.createElement('div');
    modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border: 2px solid #333;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
            z-index: 1000;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
        `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрыть';
    closeButton.style.cssText = `
            margin-top: 15px;
            padding: 8px 16px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace;">${message}</pre>`;
    modal.appendChild(closeButton);
    document.body.appendChild(modal);

    this.selectedElement = point;
    this.needsRedraw = true;
    this.redraw();
  }

  showAllLinesProperties() {
    const linesProperties = this.getAllLinesProperties();
    let message = `Всего линий: ${linesProperties.length}\n\n`;

    linesProperties.forEach((line, index) => {
      message += `Линия ${index + 1} (ID: ${line.id}):\n`;
      message += `  Длина: ${line.realLength.toFixed(1)}m\n`;
      message += `  Высота: ${line.cheight || 'не задана'}\n`;
      message += `  Ширина: ${line.cwidth || 'не задана'}\n`;
      message += `  Объем: ${line.cvolume || 'не задана'}\n`;
      message += `  tr: ${line.tr !== undefined ? line.tr.toFixed(2) : 'не задано'}\n`;
      message += `  Track свойств: ${line.track ? line.track.length : 0}\n`;
      message += `  Endtrack свойств: ${line.endtrack ? line.endtrack.length : 0}\n`;
      message += `  Passability: ${line.passability ? JSON.stringify(line.passability) : 'нет'}\n\n`;
    });

    alert(message);
  }

  getAllLinesProperties() {
    return this.lines.map(line => this.getLineProperties(line));
  }

  getLineProperties(line) {
    return {
      id: line.id,
      start: { ...line.start },
      end: { ...line.end },
      color: line.color,
      width: line.width,
      cheight: line.cheight,
      cwidth: line.cwidth,
      cvolume: line.cvolume,
      tr: line.tr,
      customLength: line.customLength,
      realLength: this.calculateLineLength(line),
      track: line.track || [],
      endtrack: line.endtrack || [],
      passability: line.passability || {}
    };
  }

  showLineTrackInfoHandler() {
    if (this.selectedElement && this.selectedElement.start && this.selectedElement.end) {
      this.showLineTrackInfo(this.selectedElement);
    } else {
      alert('Выберите линию для просмотра свойств');
    }
  }

  showLineTrackInfo(line) {
    let message = `Свойства линии (ID: ${line.id}):\n`;
    message += `Начало: (${line.start.x.toFixed(1)}, ${line.start.y.toFixed(1)})\n`;
    message += `Конец: (${line.end.x.toFixed(1)}, ${line.end.y.toFixed(1)})\n`;
    message += `Длина: ${this.calculateLineLength(line).toFixed(1)}px\n`;
    message += `tr: ${line.tr !== undefined ? line.tr.toFixed(2) : 'не задано'}\n\n`;

    message += `Свойство track (начало в точках пересечения):\n`;
    if (line.track && line.track.length > 0) {
      line.track.forEach(trackId => {
        const point = this.intersectionPoints.find(p => p.id === trackId);
        if (point) {
          message += `  • Точка #${trackId} (${point.x.toFixed(1)}, ${point.y.toFixed(1)})\n`;
          const intersection = point.intersections.find(i =>
            (i.type === 'line-line' && (i.line1Id === line.id || i.line2Id === line.id)) ||
            (i.type === 'line-object' && i.lineId === line.id)
          );
          if (intersection) {
            if (intersection.type === 'line-line') {
              message += `    Тип: пересечение с линией\n`;
            } else if (intersection.type === 'line-object') {
              message += `    Тип: пересечение с объектом "${intersection.object.label}"\n`;
              message += `    airValue объекта: ${intersection.object.airValue}\n`;
            }
          }
        }
      });
    } else {
      message += `  нет\n`;
    }

    message += `\nСвойство endtrack (конец в точках пересечения):\n`;
    if (line.endtrack && line.endtrack.length > 0) {
      line.endtrack.forEach(endtrackId => {
        const point = this.intersectionPoints.find(p => p.id === endtrackId);
        if (point) {
          message += `  • Точка #${endtrackId} (${point.x.toFixed(1)}, ${point.y.toFixed(1)})\n`;
          const intersection = point.intersections.find(i =>
            (i.type === 'line-line' && (i.line1Id === line.id || i.line2Id === line.id)) ||
            (i.type === 'line-object' && i.lineId === line.id)
          );
          if (intersection) {
            if (intersection.type === 'line-line') {
              message += `    Тип: пересечение с линией\n`;
            } else if (intersection.type === 'line-object') {
              message += `    Тип: пересечение с объектом "${intersection.object.label}"\n`;
              message += `    airValue объекта: ${intersection.object.airValue}\n`;
            }
          }
        }
      });
    } else {
      message += `  нет\n`;
    }

    message += `\nСвойство passability:\n`;
    if (line.passability && Object.keys(line.passability).length > 0) {
      Object.entries(line.passability).forEach(([pointId, value]) => {
        if (pointId === 'default') {
          message += `  • По умолчанию: ${value}\n`;
        } else {
          const point = this.intersectionPoints.find(p => p.id == pointId);
          if (point) {
            let endpointInfo = '';
            if (value === 5) endpointInfo = '(начало линии)';
            else if (value === 10) endpointInfo = '(конец линии)';
            message += `  • Точка #${pointId}: ${value} ${endpointInfo}\n`;

            const intersection = point.intersections.find(i =>
              (i.type === 'line-line' && (i.line1Id === line.id || i.line2Id === line.id)) ||
              (i.type === 'line-object' && i.lineId === line.id)
            );
            if (intersection) {
              if (intersection.type === 'line-line') {
                message += `    Тип: пересечение с линией\n`;
              } else if (intersection.type === 'line-object') {
                message += `    Тип: пересечение с объектом "${intersection.object.label}"\n`;
                message += `    airValue объекта: ${intersection.object.airValue}\n`;
              }
            }
          }
        }
      });

      const total = this.getLineTotalPassability(line);
      message += `  • Суммарный passability: ${total}\n`;
    } else {
      message += `  нет\n`;
    }

    console.log(message);
    alert(message);
  }

  showPassabilityInfoHandler() {
    if (this.selectedElement && this.selectedElement.start && this.selectedElement.end) {
      this.showLinePassabilityInfo(this.selectedElement);
    } else {
      alert('Выберите линию для просмотра свойств passability');
    }
  }

  showLinePassabilityInfo(line) {
    let message = `Свойства passability для линии (ID: ${line.id}):\n`;
    message += `Начало: (${line.start.x.toFixed(1)}, ${line.start.y.toFixed(1)})\n`;
    message += `Конец: (${line.end.x.toFixed(1)}, ${line.end.y.toFixed(1)})\n\n`;

    if (line.passability && Object.keys(line.passability).length > 0) {
      message += `Значения passability:\n`;

      Object.entries(line.passability).forEach(([pointId, value]) => {
        if (pointId === 'default') {
          message += `  • По умолчанию: ${value}\n`;
        } else {
          const point = this.intersectionPoints.find(p => p.id == pointId);
          if (point) {
            let endpointInfo = '';
            if (value === 5) endpointInfo = '(подходит началом)';
            else if (value === 10) endpointInfo = '(подходит концом)';
            message += `  • Точка #${pointId} (${point.x.toFixed(1)}, ${point.y.toFixed(1)}): ${value} ${endpointInfo}\n`;

            const intersection = point.intersections.find(i =>
              (i.type === 'line-line' && (i.line1Id === line.id || i.line2Id === line.id)) ||
              (i.type === 'line-object' && i.lineId === line.id)
            );
            if (intersection) {
              if (intersection.type === 'line-line') {
                message += `    Тип: пересечение с линией\n`;
              } else if (intersection.type === 'line-object') {
                message += `    Тип: пересечение с объектом "${intersection.object.label}"\n`;
                message += `    airValue объекта: ${intersection.object.airValue}\n`;
              }
            }
          }
        }
      });

      const total = this.getLineTotalPassability(line);
      message += `\nСуммарный passability: ${total}`;
    } else {
      message += `Нет данных о passability`;
    }

    console.log(message);
    alert(message);
  }

  exportAllLinesData() {
    const data = this.lines.map(line => this.getLineProperties(line));
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'линии_данные.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Данные экспортированы:', data);
    alert('Данные о линиях экспортированы в файл "линии_данные.json"');
  }

  exportIntersectionData() {
    const data = this.intersectionPoints.map(point => {
      const info = point.getInfo();
      info.intersectionTypes = {
        lineLine: point.intersections.filter(i => i.type === 'line-line').length,
        lineObject: point.intersections.filter(i => i.type === 'line-object').length
      };

      // Добавляем информацию об объектах в точке
      const objectsInPoint = [];
      point.intersections.forEach(intersection => {
        if (intersection.type === 'line-object' && intersection.object) {
          objectsInPoint.push({
            id: intersection.object.id,
            label: intersection.object.label,
            type: intersection.object.type,
            airValue: intersection.object.airValue
          });
        }
      });

      info.objects = objectsInPoint;
      return info;
    });

    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'точки_пересечения.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Данные о точках пересечения экспортированы:', data);
    alert('Данные о точках пересечения экспортированы в файл "точки_пересечения.json"');
  }

  clearAll() {
    if (confirm('Вы уверены, что хотите очистить всё?')) {
      this.lines = [];
      this.objects = [];
      this.intersectionPoints = [];
      this.intersectionInfo = [];
      IntersectionPoint.resetCounter();
      this.hidePropertiesPanel();
      this.hideLinePropertiesPanel();
      this.needsRedraw = true;
      this.updateStats();
      this.redraw();
    }
  }

  logAllLines() {
    console.log('Линии:', this.lines);
    console.log('Объекты:', this.objects);
    console.log('Точки пересечения:', this.intersectionPoints);
    alert(`Линий: ${this.lines.length}, Объектов: ${this.objects.length}, Точек пересечения: ${this.intersectionPoints.length}`);
  }

  clearIntersections() {
    this.intersectionPoints = [];
    this.intersectionInfo = [];
    IntersectionPoint.resetCounter();
    this.showIntersections = false;
    this.needsRedraw = true;
    this.updateStats();
    this.redraw();
    console.log('Точки пересечения очищены');
  }

  toggleIntersections() {
    this.showIntersections = !this.showIntersections;
    const toggleButton = document.getElementById('toggleIntersections');
    if (toggleButton) {
      toggleButton.textContent = this.showIntersections ?
        'Скрыть пересечения' : 'Показать пересечения';
    }
    this.needsRedraw = true;
    this.redraw();
    console.log(`Отображение пересечений: ${this.showIntersections ? 'включено' : 'выключено'}`);
  }

  toggleEndpoints() {
    this.showEndpoints = !this.showEndpoints;
    const toggleButton = document.getElementById('toggleEndpoints');
    if (toggleButton) {
      toggleButton.textContent = this.showEndpoints ?
        'Скрыть маркеры концов' : 'Показать маркеры концов';
    }
    this.needsRedraw = true;
    this.redraw();
    console.log(`Отображение маркеров концов: ${this.showEndpoints ? 'включено' : 'выключено'}`);
  }

  saveAsPDF() {
    if (typeof window.jspdf === 'undefined') {
      alert('Библиотека jsPDF не загружена. Пожалуйста, проверьте подключение к интернету.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const canvas = this.canvas;
    const imgData = canvas.toDataURL('image/png');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
    const scaledWidth = canvasWidth * ratio;
    const scaledHeight = canvasHeight * ratio;
    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;

    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

    const currentDate = new Date().toLocaleDateString('ru-RU');
    pdf.setFontSize(10);
    pdf.text(`Дата создания: ${currentDate}`, 10, 10);
    pdf.text(`Всего линий: ${this.lines.length}`, 10, 20);
    pdf.text(`Всего объектов: ${this.objects.length}`, 10, 30);

    if (this.intersectionPoints.length > 0) {
      pdf.text(`Точек пересечения: ${this.intersectionPoints.length}`, 10, 40);
    }

    pdf.save('чертеж.pdf');
  }

  updateStats() {
    const elements = {
      'objectsCount': this.objects.length,
      'linesCount': this.lines.length,
      'intersectionsCount': this.intersectionPoints.length
    };

    Object.entries(elements).forEach(([id, count]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = count;
    });
  }

  // НОВЫЙ МЕТОД: Для удобства доступа из консоли
  printAllObjectsWithAirValue() {
    console.group('📊 Все объекты с airValue:');
    this.objects.forEach((obj, index) => {
      console.log(
        `[${index}] ${obj.label} (${obj.type}): ` +
        `airValue = ${obj.airValue || 0}, ` +
        `ID = ${obj.id}`
      );
    });
    console.groupEnd();
  }
}

// Инициализация редактора при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  const editor = new Editor('drawingCanvas');
  window.editor = editor;
  setTimeout(() => editor.redraw(), 100);
});