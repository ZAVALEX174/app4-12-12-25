// Базовый класс для всех объектов на холсте
class CanvasObject {
  constructor(type, x, y, width, height, color = '#3498db', label = 'Объект') {
    this.id = Date.now() + Math.random();
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.label = label;
    this.selected = false;
    this.properties = {};
    this.image = null;
    this.imageLoaded = false;
    this.rotation = 0;
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
  }

  isPointInside(x, y) {
    return x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height;
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
      ...this.properties
    };
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  setLabel(label) {
    this.label = label;
  }

  setRotation(rotation) {
    this.rotation = rotation;
  }
}

class ImageObject extends CanvasObject {
  constructor(type, x, y, width, height, imageUrl, label = 'Объект') {
    super(type, x, y, width, height, '#3498db', label);
    this.properties = {imageUrl: imageUrl};
    this.imageLoading = false;

    if (imageUrl) {
      this.imageLoading = true;
      this.loadImage(imageUrl)
        .then(() => {
          this.imageLoading = false;
          if (this.onImageLoad) this.onImageLoad();
        })
        .catch(error => {
          console.error('Ошибка загрузки изображения:', error);
          this.imageLoading = false;
          if (this.onImageLoad) this.onImageLoad();
        });
    }
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
      this.drawPlaceholder(ctx);
    }

    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height + 5);

    if (this.selected) {
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
}

// Класс для точки пересечения с уникальным ID
class IntersectionPoint {
  // Статический счетчик для всех экземпляров класса
  static nextId = 1;

  constructor(x, y) {
    this.id = IntersectionPoint.nextId++;
    this.x = x;
    this.y = y;
    this.intersections = []; // Массив объектов пересечений, которые привели к этой точке
    this.formula = 0;
  }

  // Проверка близости точек (порог 1 пиксель)
  isNear(otherPoint, tolerance = 5) {
    return Math.sqrt(Math.pow(this.x - otherPoint.x, 2) + Math.pow(this.y - otherPoint.y, 2)) < tolerance;
  }

  // Получение информации о точке
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

  // Статический метод для сброса счетчика
  static resetCounter() {
    IntersectionPoint.nextId = 1;
  }
}

class ObjectFactory {
  static createObject(type, x, y) {
    const objectConfigs = {
      'door': {
        width: 30,
        height: 30,
        image: './img/dvercloses.png',
        label: 'Дверь закрытая'
      },
      'door2': {
        width: 30,
        height: 30,
        image: './img/dverwentoknowood.png',
        label: 'Дверь деревянная с вентоткном'
      },
      'door3': {
        width: 40,
        height: 30,
        image: './img/dverventrech.png',
        label: 'Дверь с вентрешеткой'
      },
      'door4': {
        width: 30,
        height: 30,
        image: './img/dveropenmetall.png',
        label: 'Дверь металлическая открытая'
      },
      'fan': {
        width: 40,
        height: 40,
        image: './img/fan.png',
        label: 'Вентилятор основной'
      },
      'fan2': {
        width: 40,
        height: 40,
        image: './img/fan2.png',
        label: 'Вентилятор'
      },
      'fire': {width: 40, height: 40, image: './img/fire.png', label: 'Огонь'},
      'fire2': {
        width: 40,
        height: 40,
        image: './img/pozarniigidrant.png',
        label: 'Пожарный гидрант'
      },
      'boom': {
        width: 40,
        height: 40,
        image: './img/massovievzivniepaboti.png',
        label: 'Массовые взрывные работы'
      },
      'boom2': {
        width: 40,
        height: 40,
        image: './img/vzrivnieraboti.png',
        label: 'Взрывные работы'
      },
      'medical': {
        width: 40,
        height: 40,
        image: './img/medpunkt.png',
        label: 'Медицинский пункт'
      },
      'building': {
        width: 30,
        height: 30,
        image: './img/nadshahtnoe.png',
        label: 'Надшахтное строение'
      },
      'pumps': {
        width: 40,
        height: 40,
        image: './img/nanospogruznoi.png',
        label: 'Насос погружной'
      },
      'pumps2': {
        width: 40,
        height: 40,
        image: './img/nasosnayastancia.png',
        label: 'Насосная станция'
      },
      'people': {
        width: 40,
        height: 40,
        image: './img/people.png',
        label: 'Люди'
      },
      'jumper': {
        width: 30,
        height: 30,
        image: './img/petemichkabeton.png',
        label: 'Перемычка бетонная'
      },
      'jumper2': {
        width: 30,
        height: 30,
        image: './img/petemichkakirpich.png',
        label: 'Перемычка кирпичная'
      },
      'jumper3': {
        width: 30,
        height: 30,
        image: './img/petemichkametall.png',
        label: 'Перемычка металлическая'
      },
      'jumper4': {
        width: 30,
        height: 30,
        image: './img/petemichkawood.png',
        label: 'Перемычка деревянная'
      },
      'phone': {
        width: 40,
        height: 40,
        image: './img/phone.png',
        label: 'Телефон'
      },
      'equipment': {
        width: 40,
        height: 40,
        image: './img/samohodnoe.png',
        label: 'Самоходное оборудование'
      },
      'entrance': {
        width: 40,
        height: 20,
        image: './img/zapasvhod.png',
        label: 'Запасной вход'
      }
    };

    const config = objectConfigs[type];
    if (config) {
      return new ImageObject(type, x, y, config.width, config.height, config.image, config.label);
    } else {
      return new CanvasObject('generic', x, y, 50, 50, '#3498db', 'Объект');
    }
  }

  static getObjectTypes() {
    return [
      {
        type: 'door',
        name: 'Дверь закрытая',
        icon: './img/dvercloses.png',
        category: 'doors_windows'
      },
      {
        type: 'door2',
        name: 'Дверь деревянная с вентоткном',
        icon: './img/dverwentoknowood.png',
        category: 'doors_windows'
      },
      {
        type: 'door3',
        name: 'Дверь с вентрешеткой',
        icon: './img/dverventrech.png',
        category: 'doors_windows'
      },
      {
        type: 'door4',
        name: 'Дверь металлическая открытая',
        icon: './img/dveropenmetall.png',
        category: 'doors_windows'
      },
      {
        type: 'fan',
        name: 'Вентилятор основной',
        icon: './img/fan.png',
        category: 'fan'
      },
      {
        type: 'fan2',
        name: 'Вентилятор',
        icon: './img/fan2.png',
        category: 'fan'
      },
      {type: 'fire', name: 'Огонь', icon: './img/fire.png', category: 'fire'},
      {
        type: 'fire2',
        name: 'Пожарный гидрант',
        icon: './img/pozarniigidrant.png',
        category: 'fire'
      },
      {
        type: 'boom',
        name: 'Массовые взрывные работы',
        icon: './img/massovievzivniepaboti.png',
        category: 'boom'
      },
      {
        type: 'boom2',
        name: 'Взрывные работы',
        icon: './img/vzrivnieraboti.png',
        category: 'boom'
      },
      {
        type: 'medical',
        name: 'Медицинский пункт',
        icon: './img/medpunkt.png',
        category: 'medical'
      },
      {
        type: 'building',
        name: 'Надшахтное строение',
        icon: './img/nadshahtnoe.png',
        category: 'building'
      },
      {
        type: 'pumps',
        name: 'Насос погружной',
        icon: './img/nanospogruznoi.png',
        category: 'pumps'
      },
      {
        type: 'pumps2',
        name: 'Насосная станция',
        icon: './img/nasosnayastancia.png',
        category: 'pumps'
      },
      {
        type: 'people',
        name: 'Люди',
        icon: './img/people.png',
        category: 'people'
      },
      {
        type: 'jumper',
        name: 'Перемычка бетонная',
        icon: './img/petemichkabeton.png',
        category: 'jumper'
      },
      {
        type: 'jumper2',
        name: 'Перемычка кирпичная',
        icon: './img/petemichkakirpich.png',
        category: 'jumper'
      },
      {
        type: 'jumper3',
        name: 'Перемычка металлическая',
        icon: './img/petemichkametall.png',
        category: 'jumper'
      },
      {
        type: 'jumper4',
        name: 'Перемычка деревянная',
        icon: './img/petemichkawood.png',
        category: 'jumper'
      },
      {
        type: 'phone',
        name: 'Телефон',
        icon: './img/phone.png',
        category: 'phone'
      },
      {
        type: 'equipment',
        name: 'Самоходное оборудование',
        icon: './img/samohodnoe.png',
        category: 'equipment'
      },
      {
        type: 'entrance',
        name: 'Запасной вход',
        icon: './img/zapasvhod.png',
        category: 'entrance'
      }
    ];
  }
}

class Editor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mode = 'draw';
    this.lineColor = 'gray';
    this.lineWidth = 10;
    this.snapToGrid = true;
    this.snapToPoints = true;
    this.gridSize = 20;
    this.cheight = null;
    this.cwidth = null;
    this.cvolume = null;
    this.isDrawing = false;
    this.isMoving = false;
    this.isEditing = false;
    this.selectedElement = null;
    this.dragOffset = {x: 0, y: 0};
    this.editingPoint = null;
    this.editingLength = false;
    this.lengthEditOverlay = null;
    this.lines = [];
    this.objects = [];
    this.tempLine = null;
    this.currentObjectType = null;
    this.showIntersections = false;
    this.intersectionPoints = [];
    this.intersectionInfo = [];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupUI();
    this.setupObjectLibrary();
    this.redraw();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseout', () => this.handleMouseOut());
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();
  }

  handleResize() {
    const container = this.canvas.parentElement;
    const width = container.clientWidth - 40;
    const height = container.clientHeight - 80;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.redraw();
    }
  }

  setupUI() {
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

    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setColor(e.target.dataset.color);
      });
    });

    const snapToGrid = document.getElementById('snapToGrid');
    if (snapToGrid) {
      snapToGrid.addEventListener('change', (e) => {
        this.snapToGrid = e.target.checked;
        this.redraw();
      });
    }

    const snapToPoints = document.getElementById('snapToPoints');
    if (snapToPoints) {
      snapToPoints.addEventListener('change', (e) => {
        this.snapToPoints = e.target.checked;
      });
    }

    const clearAll = document.getElementById('clearAll');
    if (clearAll) {
      clearAll.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите очистить всё?')) {
          this.lines = [];
          this.objects = [];
          this.intersectionPoints = [];
          this.intersectionInfo = [];
          IntersectionPoint.resetCounter();
          this.hidePropertiesPanel();
          this.hideLinePropertiesPanel();
          this.updateStats();
          this.redraw();
        }
      });
    }

    const showAllLines = document.getElementById('showAllLines');
    if (showAllLines) {
      showAllLines.addEventListener('click', () => {
        console.log('Линии:', this.lines);
        console.log('Объекты:', this.objects);
        alert(`Линий: ${this.lines.length}, Объектов: ${this.objects.length}`);
      });
    }

    const findIntersections = document.getElementById('findIntersections');
    if (findIntersections) {
      findIntersections.addEventListener('click', () => {
        this.findIntersections();
        this.updateStats();
        console.log(`Найдено пересечений: ${this.intersectionPoints.length}`);
        alert(`Найдено ${this.intersectionPoints.length} точек пересечения\nСм. детали в консоли браузера (F12)`);
      });
    }

    const savePDF = document.getElementById('savePDF');
    if (savePDF) {
      savePDF.addEventListener('click', () => {
        this.saveAsPDF();
      });
    }

    const rotateButton = document.getElementById('rotateButton');
    if (rotateButton) {
      rotateButton.addEventListener('click', () => {
        this.rotateSelectedObject();
      });
    }

    const applyProperties = document.getElementById('applyProperties');
    if (applyProperties) {
      applyProperties.addEventListener('click', () => {
        this.applyObjectProperties();
      });
    }

    const cancelProperties = document.getElementById('cancelProperties');
    if (cancelProperties) {
      cancelProperties.addEventListener('click', () => {
        this.hidePropertiesPanel();
      });
    }

    const applyLineProperties = document.getElementById('applyLineProperties');
    if (applyLineProperties) {
      applyLineProperties.addEventListener('click', () => {
        this.applyLineProperties();
      });
    }

    const cancelLineProperties = document.getElementById('cancelLineProperties');
    if (cancelLineProperties) {
      cancelLineProperties.addEventListener('click', () => {
        this.hideLinePropertiesPanel();
      });
    }

    const showLineProperties = document.getElementById('showLineProperties');
    if (showLineProperties) {
      showLineProperties.addEventListener('click', () => {
        this.showAllLinesProperties();
      });
    }

    const clearIntersections = document.getElementById('clearIntersections');
    if (clearIntersections) {
      clearIntersections.addEventListener('click', () => {
        this.intersectionPoints = [];
        this.intersectionInfo = [];
        IntersectionPoint.resetCounter();
        this.showIntersections = false;
        this.updateStats();
        this.redraw();
        console.log('Точки пересечения очищены');
      });
    }

    const toggleIntersections = document.getElementById('toggleIntersections');
    if (toggleIntersections) {
      toggleIntersections.addEventListener('click', () => {
        this.showIntersections = !this.showIntersections;
        toggleIntersections.textContent =
          this.showIntersections ? 'Скрыть пересечения' : 'Показать пересечения';
        this.redraw();
        console.log(`Отображение пересечений: ${this.showIntersections ? 'включено' : 'отключено'}`);
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
      objElement.innerHTML = `
        <div class="object-icon">
          <img src="${objInfo.icon}" alt="..." title="${objInfo.name}"/>
        </div>
        <div class="object-name">${objInfo.name}</div>
      `;
      objElement.dataset.type = objInfo.type;
      objElement.dataset.category = objInfo.category;

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
      if (category === 'all' || obj.dataset.category === category) {
        obj.style.display = 'flex';
      } else {
        obj.style.display = 'none';
      }
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
      switch (mode) {
        case 'draw':
          this.canvas.style.cursor = 'crosshair';
          currentMode.textContent = this.currentObjectType ? 'Добавление объектов' : 'Рисование линий';
          break;
        case 'move':
          this.canvas.style.cursor = 'move';
          currentMode.textContent = 'Перемещение';
          break;
        case 'edit':
          this.canvas.style.cursor = 'pointer';
          currentMode.textContent = 'Редактирование';
          break;
        case 'delete':
          this.canvas.style.cursor = 'not-allowed';
          currentMode.textContent = 'Удаление';
          break;
      }
    }
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

  showPropertiesPanel(obj) {
    const panel = document.getElementById('propertiesPanel');
    const labelInput = document.getElementById('propertyLabel');
    const widthInput = document.getElementById('propertyWidth');
    const heightInput = document.getElementById('propertyHeight');
    if (!panel || !labelInput || !widthInput || !heightInput) return;
    labelInput.value = obj.label;
    widthInput.value = obj.width;
    heightInput.value = obj.height;
    panel.style.display = 'block';
  }

  hidePropertiesPanel() {
    const panel = document.getElementById('propertiesPanel');
    if (panel) panel.style.display = 'none';
    this.selectedElement = null;
  }

  showLinePropertiesPanel(line) {
    const panel = document.getElementById('linePropertiesPanel');
    const cheightInput = document.getElementById('lineCheight');
    const cwidthInput = document.getElementById('lineCwidth');
    const cvolumeInput = document.getElementById('lineCvolume');
    const lengthInput = document.getElementById('lineLength');
    if (!panel || !cheightInput || !cwidthInput || !cvolumeInput || !lengthInput) return;
    cheightInput.value = line.cheight || '';
    cwidthInput.value = line.cwidth || '';
    cvolumeInput.value = line.cvolume || '';
    lengthInput.value = `${this.calculateLineLength(line).toFixed(1)}m`;
    panel.style.display = 'block';
  }

  hideLinePropertiesPanel() {
    const panel = document.getElementById('linePropertiesPanel');
    if (panel) panel.style.display = 'none';
    this.selectedElement = null;
  }

  applyObjectProperties() {
    if (!this.selectedElement) return;
    const labelInput = document.getElementById('propertyLabel');
    const widthInput = document.getElementById('propertyWidth');
    const heightInput = document.getElementById('propertyHeight');
    if (!labelInput || !widthInput || !heightInput) return;
    this.selectedElement.setLabel(labelInput.value);
    this.selectedElement.setSize(parseInt(widthInput.value), parseInt(heightInput.value));
    this.redraw();
  }

  applyLineProperties() {
    if (!this.selectedElement || !this.selectedElement.start) return;
    const cheightInput = document.getElementById('lineCheight');
    const cwidthInput = document.getElementById('lineCwidth');
    const cvolumeInput = document.getElementById('lineCvolume');
    if (!cheightInput || !cwidthInput || !cvolumeInput) return;
    this.selectedElement.cheight = cheightInput.value ? parseFloat(cheightInput.value) : null;
    this.selectedElement.cwidth = cwidthInput.value ? parseFloat(cwidthInput.value) : null;
    this.selectedElement.cvolume = cvolumeInput.value ? parseFloat(cvolumeInput.value) : null;
    this.redraw();
    this.hideLinePropertiesPanel();
  }

  rotateSelectedObject() {
    if (!this.selectedElement) return;
    this.selectedElement.rotate(90);
    this.redraw();
  }

  showAllLinesProperties() {
    const linesProperties = this.getAllLinesProperties();
    console.log('Свойства всех линий:', linesProperties);
    let message = `Всего линий: ${linesProperties.length}\n\n`;
    linesProperties.forEach((line, index) => {
      message += `Линия ${index + 1}:\n`;
      message += `  Длина: ${line.realLength.toFixed(1)}m\n`;
      message += `  Высота: ${line.cheight || 'не задана'}\n`;
      message += `  Ширина: ${line.cwidth || 'не задана'}\n`;
      message += `  Объем: ${line.cvolume || 'не задана'}\n\n`;
    });
    alert(message);
  }

  getAllLinesProperties() {
    return this.lines.map(line => this.getLineProperties(line));
  }

  getLineProperties(line) {
    return {
      id: line.id,
      start: {...line.start},
      end: {...line.end},
      color: line.color,
      width: line.width,
      cheight: line.cheight,
      cwidth: line.cwidth,
      cvolume: line.cvolume,
      customLength: line.customLength,
      realLength: this.calculateLineLength(line)
    };
  }

  // Метод: Объединение близких точек пересечения
  mergeCloseIntersectionPoints(allPoints) {
    const mergedPoints = [];

    for (const point of allPoints) {
      let found = false;

      // Ищем близкую точку в уже объединенных точках
      for (const mergedPoint of mergedPoints) {
        if (mergedPoint.isNear(point, 1)) { // Порог 1 пиксель
          // Объединяем информацию о пересечениях
          mergedPoint.intersections.push(...point.intersections);
          found = true;
          break;
        }
      }

      // Если близкая точка не найдена, добавляем новую
      if (!found) {
        mergedPoints.push(point);
      }
    }

    return mergedPoints;
  }

  // Метод: Поиск пересечений с объединением точек
  findIntersections() {
    const allIntersectionPoints = [];

    // 1. Поиск пересечений линий с объектами
    for (const line of this.lines) {
      for (const obj of this.objects) {
        const points = this.getLineObjectIntersections(line, obj);
        for (const point of points) {
          const intersectionPoint = new IntersectionPoint(point.x, point.y);
          intersectionPoint.intersections.push({
            type: 'line-object',
            line: line,
            object: obj
          });
          allIntersectionPoints.push(intersectionPoint);
        }
      }
    }

    // 2. Поиск пересечений линий с линиями
    for (let i = 0; i < this.lines.length; i++) {
      for (let j = i + 1; j < this.lines.length; j++) {
        const line1 = this.lines[i];
        const line2 = this.lines[j];
        const intersection = this.getLineIntersection(
          line1.start, line1.end,
          line2.start, line2.end
        );

        if (intersection) {
          const isOnLine1 = this.isPointOnLineSegment(intersection, line1.start, line1.end, 0.1);
          const isOnLine2 = this.isPointOnLineSegment(intersection, line2.start, line2.end, 0.1);

          if (isOnLine1 && isOnLine2) {
            const intersectionPoint = new IntersectionPoint(intersection.x, intersection.y);
            intersectionPoint.intersections.push({
              type: 'line-line',
              line1: line1,
              line2: line2
            });
            allIntersectionPoints.push(intersectionPoint);
          }
        }
      }
    }

    // 3. Объединение близких точек
    this.intersectionPoints = this.mergeCloseIntersectionPoints(allIntersectionPoints);

    // 4. Сохранение информации для отладки
    this.intersectionInfo = this.intersectionPoints.map(point => point.getInfo());

    // 5. Вывод результатов в консоль
    console.log('=== ПЕРЕСЕЧЕНИЯ (С ОБЪЕДИНЕНИЕМ ТОЧЕК) ===');
    console.log(`Найдено уникальных точек пересечения: ${this.intersectionPoints.length}`);
    console.log(`Всего исходных точек до объединения: ${allIntersectionPoints.length}`);

    this.intersectionPoints.forEach((point, index) => {
      console.log(`\nТочка пересечения ${index + 1} (ID: ${point.id}):`);
      console.log(`Координаты: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
      console.log(`Количество пересечений в точке: ${point.intersections.length}`);

      point.intersections.forEach((intersection, i) => {
        if (intersection.type === 'line-object') {
          console.log(`  Пересечение ${i + 1} (линия-объект):`);
          console.log(`    Линия: (${intersection.line.start.x},${intersection.line.start.y}) - (${intersection.line.end.x},${intersection.line.end.y})`);
          console.log(`    Объект: ${intersection.object.label} (${intersection.object.type})`);
        } else if (intersection.type === 'line-line') {
          console.log(`  Пересечение ${i + 1} (линия-линия):`);
          console.log(`    Линия 1: (${intersection.line1.start.x},${intersection.line1.start.y}) - (${intersection.line1.end.x},${intersection.line1.end.y})`);
          console.log(`    Линия 2: (${intersection.line2.start.x},${intersection.line2.start.y}) - (${intersection.line2.end.x},${intersection.line2.end.y})`);
        }
      });
    });

    if (this.intersectionPoints.length === 0) {
      console.log('Пересечений не найдено');
    }

    console.log('==========================================');

    // Включаем отображение точек пересечения
    this.showIntersections = true;
    this.redraw();

    return this.intersectionPoints;
  }

  // Метод: Проверка точки на отрезке линии
  isPointOnLineSegment(point, lineStart, lineEnd, tolerance = 1) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < tolerance;
  }

  // Метод: Получение пересечений линии с объектом
  getLineObjectIntersections(line, obj) {
    const intersectionPoints = [];
    const bounds = this.getRotatedObjectBounds(obj);

    for (let i = 0; i < bounds.length; i++) {
      const sideStart = bounds[i];
      const sideEnd = bounds[(i + 1) % bounds.length];
      const intersection = this.getLineIntersection(line.start, line.end, sideStart, sideEnd);

      if (intersection && this.isPointOnLineSegment(intersection, line.start, line.end, 0.1)) {
        intersectionPoints.push(intersection);
      }
    }

    const uniquePoints = [];
    for (const point of intersectionPoints) {
      let isUnique = true;
      for (const uniquePoint of uniquePoints) {
        if (Math.abs(point.x - uniquePoint.x) < 0.1 && Math.abs(point.y - uniquePoint.y) < 0.1) {
          isUnique = false;
          break;
        }
      }
      if (isUnique) uniquePoints.push(point);
    }

    return uniquePoints;
  }

  // Метод: Получение границ повернутого объекта
  getRotatedObjectBounds(obj) {
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    const angle = obj.rotation * Math.PI / 180;
    const corners = [
      {x: obj.x, y: obj.y},
      {x: obj.x + obj.width, y: obj.y},
      {x: obj.x + obj.width, y: obj.y + obj.height},
      {x: obj.x, y: obj.y + obj.height}
    ];

    return corners.map(corner => {
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;
      const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
      const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
      return {
        x: rotatedX + centerX,
        y: rotatedY + centerY
      };
    });
  }

  // Метод: Нахождение пересечения двух линий
  getLineIntersection(p1, p2, p3, p4) {
    const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (Math.abs(denominator) < 0.001) return null;

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y)
      };
    }

    return null;
  }

  splitAllIntersectingLines() {
    const linesToSplit = [];

    for (let i = 0; i < this.lines.length; i++) {
      for (let j = i + 1; j < this.lines.length; j++) {
        const line1 = this.lines[i];
        const line2 = this.lines[j];
        const intersection = this.getLineIntersection(line1.start, line1.end, line2.start, line2.end);

        if (intersection) {
          const isAtLine1Start = this.distance(intersection, line1.start) < 0.1;
          const isAtLine1End = this.distance(intersection, line1.end) < 0.1;
          const isAtLine2Start = this.distance(intersection, line2.start) < 0.1;
          const isAtLine2End = this.distance(intersection, line2.end) < 0.1;

          if (!isAtLine1Start && !isAtLine1End) {
            linesToSplit.push({line: line1, point: intersection});
          }
          if (!isAtLine2Start && !isAtLine2End) {
            linesToSplit.push({line: line2, point: intersection});
          }
        }
      }
    }

    linesToSplit.forEach(({line, point}) => {
      this.splitLine(line, point);
    });

    return linesToSplit.length > 0;
  }

  splitLine(line, splitPoint) {
    const distToStart = this.distance(splitPoint, line.start);
    const distToEnd = this.distance(splitPoint, line.end);
    if (distToStart < 1 || distToEnd < 1) return;

    const line1 = {
      ...line,
      id: Date.now() + Math.random(),
      start: {...line.start},
      end: {...splitPoint}
    };
    const line2 = {
      ...line,
      id: Date.now() + Math.random() + 1,
      start: {...splitPoint},
      end: {...line.end}
    };

    this.lines = this.lines.filter(l => l.id !== line.id);
    this.lines.push(line1, line2);
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  snapPosition(x, y) {
    let snappedX = x;
    let snappedY = y;

    if (this.snapToGrid) {
      snappedX = Math.round(x / this.gridSize) * this.gridSize;
      snappedY = Math.round(y / this.gridSize) * this.gridSize;
    }

    if (this.snapToPoints) {
      let closestDistance = 15;
      let closestPoint = null;

      this.lines.forEach(line => {
        [line.start, line.end].forEach(point => {
          const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = point;
          }
        });
      });

      this.objects.forEach(obj => {
        const points = [
          {x: obj.x, y: obj.y},
          {x: obj.x + obj.width, y: obj.y},
          {x: obj.x, y: obj.y + obj.height},
          {x: obj.x + obj.width, y: obj.y + obj.height}
        ];

        points.forEach(point => {
          const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = point;
          }
        });
      });

      if (closestPoint) {
        snappedX = closestPoint.x;
        snappedY = closestPoint.y;
      }
    }

    return {x: snappedX, y: snappedY};
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

  // НОВЫЙ МЕТОД: Обработка клика по точкам пересечения
  handleClick(e) {
    const mousePos = this.getMousePos(e);

    // Проверяем, кликнули ли на точку пересечения
    const clickedPoint = this.findIntersectionPointAtPosition(mousePos);

    if (clickedPoint) {
      this.showIntersectionInfo(clickedPoint);
      e.stopPropagation();
    }
  }

  // НОВЫЙ МЕТОД: Поиск точки пересечения по координатам
  findIntersectionPointAtPosition(pos, tolerance = 10) {
    for (let point of this.intersectionPoints) {
      const distance = Math.sqrt(Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2));
      if (distance < tolerance) {
        return point;
      }
    }
    return null;
  }

  // НОВЫЙ МЕТОД: Показать информацию о точке пересечения
  showIntersectionInfo(point) {
    let message = `Точка пересечения #${point.id}\n`;
    message += `Координаты: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})\n`;
    message += `Количество пересечений в точке: ${point.intersections.length}\n\n`;

    if (point.intersections.length > 0) {
      message += "Детали пересечений:\n";
      point.intersections.forEach((intersection, index) => {

        message += `\nПересечение ${index + 1}:\n`;

        if (intersection.type === 'line-object') {
          message += `  Тип: Линия с объектом\n`;
          message += `  Линия: (${intersection.line.start.x.toFixed(1)},${intersection.line.start.y.toFixed(1)}) - (${intersection.line.end.x.toFixed(1)},${intersection.line.end.y.toFixed(1)})\n`;
          message += `  Объект: ${intersection.object.label}\n`;
          message += `  Тип объекта: ${intersection.object.type}`;
        } else if (intersection.type === 'line-line') {
          message += `  Тип: Линия с линией\n`;
          message += `  Линия 1: (${intersection.line1.start.x.toFixed(1)},${intersection.line1.start.y.toFixed(1)}) - (${intersection.line1.end.x.toFixed(1)},${intersection.line1.end.y.toFixed(1)})\n`;
          message += `  Линия 2: (${intersection.line2.start.x.toFixed(1)},${intersection.line2.start.y.toFixed(1)}) - (${intersection.line2.end.x.toFixed(1)},${intersection.line2.end.y.toFixed(1)})`;
        }
      });
    } else {
      message += "Нет деталей о пересечениях";
    }

    console.log(point);

    alert(message);

    let tutorial = document.createElement("input");
    const tutorialButton = document.createElement("Button");
    tutorial.type = "text";
    // tutorial.value = point;
    console.log(tutorial.value);

    tutorialButton.textContent = "ПОЛУЧИ";
    document.body.appendChild(tutorial);
    document.body.appendChild(tutorialButton);

    tutorialButton.addEventListener("click", (e) => {
      e.preventDefault();
      let yy = tutorial.value;
      console.log(yy);
      console.log(point.formula);
      point.formula = yy;
      console.log(point.formula);
      console.log(point);
    });

    // Подсвечиваем точку при клике
    this.selectedElement = point;
    this.redraw();
  }

  startDrawing(pos) {
    this.isDrawing = true;
    this.tempLine = {
      start: {...pos},
      end: {...pos},
      color: this.lineColor,
      width: this.lineWidth,
      cheight: this.cheight,
      cwidth: this.cwidth,
      cvolume: this.cvolume,
    };
  }

  continueDrawing(pos) {
    if (this.isDrawing && this.tempLine) {
      this.tempLine.end = {...pos};
      this.redraw();
    }
  }

  finishDrawing() {
    if (this.isDrawing && this.tempLine) {
      const dx = this.tempLine.end.x - this.tempLine.start.x;
      const dy = this.tempLine.end.y - this.tempLine.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 5) {
        this.lines.push({...this.tempLine, id: Date.now() + Math.random()});
        this.splitAllIntersectingLines();
        this.updateStats();
      }

      this.tempLine = null;
      this.isDrawing = false;
      this.redraw();
    }
  }

  startMoving(pos) {
    this.selectedElement = this.findObjectAtPoint(pos);
    if (this.selectedElement) {
      this.isMoving = true;
      this.dragOffset = {
        x: pos.x - this.selectedElement.x,
        y: pos.y - this.selectedElement.y
      };
      return;
    }

    this.selectedElement = this.findLineAtPoint(pos);
    if (this.selectedElement) {
      this.isMoving = true;
      this.dragOffset = {
        x: pos.x - this.selectedElement.start.x,
        y: pos.y - this.selectedElement.start.y
      };
    }
  }

  continueMoving(pos) {
    if (this.isMoving && this.selectedElement) {
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
        this.selectedElement.setPosition(pos.x - this.dragOffset.x, pos.y - this.dragOffset.y);
      }
      this.redraw();
    }
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
        this.dragOffset = {x: pos.x - targetPoint.x, y: pos.y - targetPoint.y};
      } else {
        this.showLinePropertiesPanel(this.selectedElement);
      }
      return;
    }

    this.hidePropertiesPanel();
    this.hideLinePropertiesPanel();
  }

  continueEditing(pos) {
    if (this.isEditing && this.selectedElement && this.editingPoint) {
      const targetPoint = this.selectedElement[this.editingPoint];
      targetPoint.x = pos.x - this.dragOffset.x;
      targetPoint.y = pos.y - this.dragOffset.y;

      if (this.snapToGrid) {
        const snappedPos = this.snapPosition(targetPoint.x, targetPoint.y);
        targetPoint.x = snappedPos.x;
        targetPoint.y = snappedPos.y;
      }

      this.redraw();
    }
  }

  deleteAtPosition(pos) {
    const objectToDelete = this.findObjectAtPoint(pos);
    if (objectToDelete) {
      this.objects = this.objects.filter(obj => obj !== objectToDelete);
      this.hidePropertiesPanel();
      this.updateStats();
      this.redraw();
      return;
    }

    const lineToDelete = this.findLineAtPoint(pos);
    if (lineToDelete) {
      this.lines = this.lines.filter(line => line !== lineToDelete);
      this.hideLinePropertiesPanel();
      this.updateStats();
      this.redraw();
    }
  }

  finishInteraction() {
    this.isMoving = false;
    this.isEditing = false;
    this.editingPoint = null;
    this.dragOffset = {x: 0, y: 0};
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
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

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

  findLineAtPoint(pos, tolerance = 10) {
    for (let line of this.lines) {
      if (this.distance(pos, line.start) < tolerance || this.distance(pos, line.end) < tolerance) {
        return line;
      }

      if (this.isPointOnLine(pos, line, tolerance)) {
        return line;
      }
    }
    return null;
  }

  isPointOnLine(point, line, tolerance = 10) {
    const {start, end} = line;
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
    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < tolerance;
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

  distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  calculateLineLength(line) {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.snapToGrid) this.drawGrid();

    this.lines.forEach(line => {
      this.drawLine(line);
      this.drawLengthInfo(line);
      this.drawLineProperties(line);
    });

    this.objects.forEach(obj => this.drawObject(obj));

    if (this.tempLine) this.drawLine(this.tempLine);

    if (this.showIntersections && this.intersectionPoints.length > 0) {
      this.drawIntersectionPoints();
    }

    if (this.selectedElement) this.highlightElement(this.selectedElement);
  }

  // Метод: Отрисовка точек пересечения с выделением
  drawIntersectionPoints() {
    this.intersectionPoints.forEach((point, index) => {
      this.ctx.save();

      // Проверяем, является ли точка выбранной
      const isSelected = this.selectedElement && this.selectedElement.id === point.id;

      // Цвет зависит от количества пересечений в точке и выделения
      if (isSelected) {
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.9)'; // Зеленый для выбранной точки
      } else if (point.intersections.length > 1) {
        this.ctx.fillStyle = 'rgba(255, 165, 0, 0.8)'; // Оранжевый для точек с несколькими пересечениями
      } else {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; // Красный для одиночных пересечений
      }

      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, isSelected ? 8 : 6, 0, Math.PI * 2);
      this.ctx.fill();

      // Обводка для выбранной точки
      if (isSelected) {
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

      // Подпись с ID и количеством пересечений
      this.ctx.fillStyle = 'green';
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';

      let label = `${point.id}`;
      if (point.intersections.length >= 1) {
        label += ` (${point.intersections.length})`;
        // сюда записывать формулу, если количество пересечений больше 1(формула)
        console.log(label);
        console.log(point, 'это поинт');
      } else {
        console.log("одно пересечение");
      }

      this.ctx.fillText(label, point.x, point.y - (isSelected ? 12 : 8));
      this.ctx.restore();
    });
  }

  drawGrid() {
    this.ctx.save();
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 0.5;

    for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawLine(line) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(line.start.x, line.start.y);
    this.ctx.lineTo(line.end.x, line.end.y);
    this.ctx.strokeStyle = line.color;
    this.ctx.lineWidth = line.width;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawLengthInfo(line) {
    const midPoint = {
      x: (line.start.x + line.end.x) / 2,
      y: (line.start.y + line.end.y) / 2
    };
    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (line.customLength !== undefined) {
      this.ctx.fillStyle = 'red';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(`${line.customLength}m`, midPoint.x, midPoint.y - 15);
    } else {
      const realLength = this.calculateLineLength(line);
      this.ctx.fillStyle = 'black';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`${realLength.toFixed(1)}m`, midPoint.x, midPoint.y - 15);
    }

    this.ctx.restore();
  }

  drawLineProperties(line) {
    const midPoint = {
      x: (line.start.x + line.end.x) / 2,
      y: (line.start.y + line.end.y) / 2
    };
    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = 'blue';
    this.ctx.font = '10px Arial';

    let propertiesText = '';
    if (line.cheight) propertiesText += `H:${line.cheight} `;
    if (line.cwidth) propertiesText += `W:${line.cwidth} `;
    if (line.cvolume) propertiesText += `V:${line.cvolume}`;

    if (propertiesText) {
      this.ctx.fillText(propertiesText, midPoint.x, midPoint.y + 15);
    }

    this.ctx.restore();
  }

  drawObject(obj) {
    try {
      obj.draw(this.ctx);
    } catch (error) {
      console.error('Ошибка при отрисовке объекта:', error);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      this.ctx.fillStyle = 'white';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('Ошибка', obj.x + obj.width / 2, obj.y + obj.height / 2);
    }
  }

  highlightElement(element) {
    this.ctx.save();
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    if (element.start && element.end) {
      const bounds = this.getLineBounds(element);
      this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(element.start.x, element.start.y, 5, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(element.end.x, element.end.y, 5, 0, 2 * Math.PI);
      this.ctx.fill();
    } else {
      this.ctx.strokeRect(element.x - 5, element.y - 5, element.width + 10, element.height + 10);
    }

    this.ctx.restore();
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

  addObject(type, x, y) {
    const obj = ObjectFactory.createObject(type, x, y);
    this.objects.push(obj);
    this.updateStats();
    this.redraw();

    if (obj instanceof ImageObject) {
      obj.onImageLoad = () => this.redraw();
      if (obj.imageLoaded) this.redraw();
    }
  }

  saveAsPDF() {
    if (typeof window.jspdf === 'undefined') {
      alert('Библиотека jsPDF не загружена. Пожалуйста, проверьте подключение к интернету.');
      return;
    }

    const {jsPDF} = window.jspdf;
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
    const objectsCount = document.getElementById('objectsCount');
    const linesCount = document.getElementById('linesCount');
    const intersectionsCount = document.getElementById('intersectionsCount');

    if (objectsCount) objectsCount.textContent = this.objects.length;
    if (linesCount) linesCount.textContent = this.lines.length;
    if (intersectionsCount) intersectionsCount.textContent = this.intersectionPoints.length;
  }
}

// Инициализация редактора при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  const editor = new Editor('drawingCanvas');
  window.editor = editor;
  setTimeout(() => editor.redraw(), 100);
});