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
    this.rotation = 0; // Угол вращения в градусах
  }

  // Метод для загрузки изображения
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

  // Метод для вращения объекта
  rotate(degrees = 90) {
    this.rotation = (this.rotation + degrees) % 360;
  }

  // Метод для отрисовки
  draw(ctx) {
    // Если изображение загружено, рисуем его с учетом вращения
    if (this.image && this.imageLoaded) {
      ctx.save();

      // Перемещаем контекст в центр объекта
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      ctx.translate(centerX, centerY);

      // Применяем вращение
      ctx.rotate((this.rotation * Math.PI) / 180);

      // Рисуем изображение с учетом вращения
      ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);

      ctx.restore();
    } else {
      // Иначе рисуем базовый прямоугольник
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Текст метки
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
    }

    // Если объект выбран, рисуем рамку выделения
    if (this.selected) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);

      // Показываем угол вращения
      ctx.fillStyle = '#ff0000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${this.rotation}°`, this.x - 5, this.y - 15);

      ctx.setLineDash([]);
    }
  }

  // Проверка, находится ли точка внутри объекта
  isPointInside(x, y) {
    return x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height;
  }

  // Получение свойств объекта
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

  // Обновление позиции
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  // Обновление размеров
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  // Обновление метки
  setLabel(label) {
    this.label = label;
  }

  // Установка вращения
  setRotation(rotation) {
    this.rotation = rotation;
  }
}

// Класс для объектов с изображениями
class ImageObject extends CanvasObject {
  constructor(type, x, y, width, height, imageUrl, label = 'Объект') {
    super(type, x, y, width, height, '#3498db', label);
    this.properties = {
      imageUrl: imageUrl
    };
    this.imageLoading = false;

    // Загружаем изображение при создании объекта
    if (imageUrl) {
      this.imageLoading = true;
      this.loadImage(imageUrl)
        .then(() => {
          this.imageLoading = false;
          // Уведомляем редактор о необходимости перерисовки
          if (this.onImageLoad) {
            this.onImageLoad();
          }
        })
        .catch(error => {
          console.error('Ошибка загрузки изображения:', error);
          this.imageLoading = false;
          if (this.onImageLoad) {
            this.onImageLoad();
          }
        });
    }
  }

  draw(ctx) {
    // Если изображение загружено, рисуем его с учетом вращения
    if (this.image && this.imageLoaded) {
      ctx.save();

      // Перемещаем контекст в центр объекта
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      ctx.translate(centerX, centerY);

      // Применяем вращение
      ctx.rotate((this.rotation * Math.PI) / 180);

      // Рисуем изображение с учетом вращения
      ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);

      ctx.restore();
    } else {
      // Иначе рисуем placeholder
      this.drawPlaceholder(ctx);
    }

    // Текст под объектом
    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height + 5);

    // Если объект выбран, рисуем рамку выделения
    if (this.selected) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);

      // Показываем угол вращения
      ctx.fillStyle = '#ff0000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${this.rotation}°`, this.x - 5, this.y - 15);

      ctx.setLineDash([]);
    }
  }

  // Метод для отрисовки placeholder
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

// Фабрика для создания объектов
class ObjectFactory {
  static createObject(type, x, y) {
    const objectConfigs = {
      'door': {
        width: 30,
        height: 30,
        image: './img/dvercloses.png',
        label: 'Дверь закрытая',
        tth: ''
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

      'fire': {
        width: 40,
        height: 40,
        image: './img/fire.png',
        label: 'Огонь'
      },
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
      },
    };

    const config = objectConfigs[type];
    if (config) {
      return new ImageObject(type, x, y, config.width, config.height, config.image, config.label);
    } else {
      // Возвращаем базовый объект для неизвестных типов
      return new CanvasObject('generic', x, y, 50, 50, '#3498db', 'Объект');
    }
  }

  // Метод для получения информации о всех доступных типах объектов
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

      { type: 'fire', name: 'Огонь', icon: './img/fire.png', category: 'fire' },
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
      },
    ];
  }
}

// Основной класс редактора
class Editor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Основные свойства
    this.mode = 'draw';
    this.lineColor = 'gray';
    this.lineWidth = 10;
    this.snapToGrid = true;
    this.snapToPoints = true;
    this.gridSize = 20;
    this.cheight = null;
    this.cwidth = null;
    this.cvolume = null;

    // Состояние
    this.isDrawing = false;
    this.isMoving = false;
    this.isEditing = false;
    this.selectedElement = null;
    this.dragOffset = { x: 0, y: 0 };
    this.editingPoint = null;

    // Редактирование длины
    this.editingLength = false;
    this.lengthEditOverlay = null;

    // Хранилища данных
    this.lines = [];
    this.objects = [];
    this.tempLine = null;

    // Для работы с объектами
    this.currentObjectType = null;

    // Для отображения пересечений
    this.showIntersections = false;
    this.intersectionPoints = [];
    this.intersectionInfo = [];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupUI();
    this.setupObjectLibrary();
    this.redraw(); // Изначальная перерисовка холста
  }

  setupEventListeners() {
    // События canvas
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));

    // Обработка изменения размера окна
    window.addEventListener('resize', this.handleResize.bind(this));
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
    // Кнопки режимов
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setMode(e.target.dataset.mode);
        // Сброс выбора объекта при переключении режима
        this.currentObjectType = null;
        document.querySelectorAll('.object-item').forEach(item => {
          item.classList.remove('selected');
        });

        // Скрываем панели свойств при переключении режимов
        this.hidePropertiesPanel();
        this.hideLinePropertiesPanel();
      });
    });

    // Выбор цвета
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setColor(e.target.dataset.color);
      });
    });

    // Привязка
    document.getElementById('snapToGrid').addEventListener('change', (e) => {
      this.snapToGrid = e.target.checked;
      this.redraw();
    });

    document.getElementById('snapToPoints').addEventListener('change', (e) => {
      this.snapToPoints = e.target.checked;
    });

    // Действия
    document.getElementById('clearAll').addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите очистить всё?')) {
        this.lines = [];
        this.objects = [];
        this.intersectionPoints = [];
        this.intersectionInfo = [];
        this.hidePropertiesPanel();
        this.hideLinePropertiesPanel();
        this.updateStats();
        this.redraw();
      }
    });

    document.getElementById('showAllLines').addEventListener('click', () => {
      console.log('Линии:', this.lines);
      console.log('Объекты:', this.objects);
      alert(`Линий: ${this.lines.length}, Объектов: ${this.objects.length}`);
    });

    // Кнопка для поиска пересечений
    document.getElementById('findIntersections').addEventListener('click', () => {
      this.findIntersections();

      // Обновляем статистику в UI
      this.updateStats();

      // Показываем количество пересечений в консоли и алерте
      console.log(`Найдено пересечений: ${this.intersectionPoints.length}`);
      alert(`Найдено ${this.intersectionPoints.length} точек пересечения\nСм. детали в консоли браузера (F12)`);
    });

    // Сохранение в PDF
    document.getElementById('savePDF').addEventListener('click', () => {
      this.saveAsPDF();
    });

    // Кнопки редактирования свойств
    document.getElementById('rotateButton').addEventListener('click', () => {
      this.rotateSelectedObject();
    });

    document.getElementById('applyProperties').addEventListener('click', () => {
      this.applyObjectProperties();
    });

    document.getElementById('cancelProperties').addEventListener('click', () => {
      this.hidePropertiesPanel();
    });

    // Кнопки редактирования свойств линии
    document.getElementById('applyLineProperties').addEventListener('click', () => {
      this.applyLineProperties();
    });

    document.getElementById('cancelLineProperties').addEventListener('click', () => {
      this.hideLinePropertiesPanel();
    });

    // Кнопка для показа свойств всех линий
    document.getElementById('showLineProperties').addEventListener('click', () => {
      this.showAllLinesProperties();
    });

    // Кнопка для очистки точек пересечения
    document.getElementById('clearIntersections').addEventListener('click', () => {
      this.intersectionPoints = [];
      this.intersectionInfo = [];
      this.showIntersections = false;
      this.updateStats();
      this.redraw();
      console.log('Точки пересечения очищены');
    });

    // Кнопка для включения/отключения отображения пересечений
    document.getElementById('toggleIntersections').addEventListener('click', () => {
      this.showIntersections = !this.showIntersections;
      document.getElementById('toggleIntersections').textContent =
        this.showIntersections ? 'Скрыть пересечения' : 'Показать пересечения';
      this.redraw();
      console.log(`Отображение пересечений: ${this.showIntersections ? 'включено' : 'отключено'}`);
    });
  }

  setupObjectLibrary() {
    // Категории объектов
    const categories = document.querySelectorAll('.category-btn');
    categories.forEach(btn => {
      btn.addEventListener('click', (e) => {
        categories.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.showCategory(e.target.dataset.category);
      });
    });

    // Заполняем библиотеку объектов
    this.populateObjectLibrary();
  }

  populateObjectLibrary() {
    const objectsGrid = document.getElementById('objectsGrid');
    objectsGrid.innerHTML = '';

    // Используем фабрику для получения информации о типах объектов
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

    // Обновление UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // Изменение курсора и текста статуса
    switch (mode) {
      case 'draw':
        this.canvas.style.cursor = 'crosshair';
        document.getElementById('currentMode').textContent =
          this.currentObjectType ? 'Добавление объектов' : 'Рисование линий';
        break;
      case 'move':
        this.canvas.style.cursor = 'move';
        document.getElementById('currentMode').textContent = 'Перемещение';
        break;
      case 'edit':
        this.canvas.style.cursor = 'pointer';
        document.getElementById('currentMode').textContent = 'Редактирование';
        break;
      case 'delete':
        this.canvas.style.cursor = 'not-allowed';
        document.getElementById('currentMode').textContent = 'Удаление';
        break;
    }
  }

  setColor(color) {
    this.lineColor = color;

    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const colorBtn = document.querySelector(`[data-color="${color}"]`);
    if (colorBtn) {
      colorBtn.classList.add('active');
    }

    document.getElementById('currentColor').textContent = color;
  }

  // Показать панель свойств объекта
  showPropertiesPanel(obj) {
    const panel = document.getElementById('propertiesPanel');
    const labelInput = document.getElementById('propertyLabel');
    const widthInput = document.getElementById('propertyWidth');
    const heightInput = document.getElementById('propertyHeight');

    // Заполняем поля значениями из объекта
    labelInput.value = obj.label;
    widthInput.value = obj.width;
    heightInput.value = obj.height;

    // Показываем панель
    panel.style.display = 'block';
  }

  // Скрыть панель свойств
  hidePropertiesPanel() {
    const panel = document.getElementById('propertiesPanel');
    panel.style.display = 'none';
    this.selectedElement = null;
  }

  // Показать панель свойств линии
  showLinePropertiesPanel(line) {
    const panel = document.getElementById('linePropertiesPanel');
    const cheightInput = document.getElementById('lineCheight');
    const cwidthInput = document.getElementById('lineCwidth');
    const cvolumeInput = document.getElementById('lineCvolume');
    const lengthInput = document.getElementById('lineLength');

    // Заполняем поля значениями из линии
    cheightInput.value = line.cheight || '';
    cwidthInput.value = line.cwidth || '';
    cvolumeInput.value = line.cvolume || '';
    lengthInput.value = `${this.calculateLineLength(line).toFixed(1)}m`;

    // Показываем панель
    panel.style.display = 'block';
  }

  // Скрыть панель свойств линии
  hideLinePropertiesPanel() {
    const panel = document.getElementById('linePropertiesPanel');
    panel.style.display = 'none';
    this.selectedElement = null;
  }

  // Применить свойства объекта
  applyObjectProperties() {
    if (!this.selectedElement) return;

    const labelInput = document.getElementById('propertyLabel');
    const widthInput = document.getElementById('propertyWidth');
    const heightInput = document.getElementById('propertyHeight');

    // Обновляем свойства объекта
    this.selectedElement.setLabel(labelInput.value);
    this.selectedElement.setSize(parseInt(widthInput.value), parseInt(heightInput.value));

    // Перерисовываем canvas
    this.redraw();
  }

  // Применить свойства линии
  applyLineProperties() {
    if (!this.selectedElement || !this.selectedElement.start) return;

    const cheightInput = document.getElementById('lineCheight');
    const cwidthInput = document.getElementById('lineCwidth');
    const cvolumeInput = document.getElementById('lineCvolume');

    // Обновляем свойства линии
    this.selectedElement.cheight = cheightInput.value ? parseFloat(cheightInput.value) : null;
    this.selectedElement.cwidth = cwidthInput.value ? parseFloat(cwidthInput.value) : null;
    this.selectedElement.cvolume = cvolumeInput.value ? parseFloat(cvolumeInput.value) : null;

    // Перерисовываем canvas
    this.redraw();

    // Скрываем панель
    this.hideLinePropertiesPanel();
  }

  // Вращение выбранного объекта
  rotateSelectedObject() {
    if (!this.selectedElement) return;

    this.selectedElement.rotate(90); // Поворачиваем на 90 градусов
    this.redraw();
  }

  // Показать свойства всех линий
  showAllLinesProperties() {
    const linesProperties = this.getAllLinesProperties();
    console.log('Свойства всех линий:', linesProperties);

    // Создаем красивое отображение в alert
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

  // Получить свойства всех линий
  getAllLinesProperties() {
    return this.lines.map(line => this.getLineProperties(line));
  }

  // Получить свойства конкретной линии
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
      customLength: line.customLength,
      realLength: this.calculateLineLength(line)
    };
  }

  // Метод для поиска пересечений линий и объектов
  findIntersections() {
    const intersections = [];

    // 1. Проверяем каждую линию с каждым объектом
    for (const line of this.lines) {
      for (const obj of this.objects) {
        // Получаем точки пересечения линии с объектом
        const points = this.getLineObjectIntersections(line, obj);

        if (points.length > 0) {
          intersections.push({
            type: 'line-object',
            line: line,
            object: obj,
            points: points
          });
        }
      }
    }

    // 2. Проверяем каждую линию с каждой другой линией
    const lineLineIntersections = this.findLineLineIntersections();
    intersections.push(...lineLineIntersections);

    // Сохраняем всю информацию о пересечениях
    this.intersectionInfo = intersections;

    // Собираем все точки пересечения
    this.intersectionPoints = [];
    intersections.forEach(intersection => {
      if (intersection.points) {
        this.intersectionPoints.push(...intersection.points);
      }
    });

    // Выводим результаты в консоль
    console.log('=== ПЕРЕСЕЧЕНИЯ ===');
    console.log(`Найдено пересечений: ${intersections.length}`);
    console.log(`Всего точек пересечения: ${this.intersectionPoints.length}`);

    intersections.forEach((intersection, index) => {
      console.log(`\nПересечение ${index + 1}:`);

      if (intersection.type === 'line-object') {
        console.log(`Тип: Линия с объектом`);
        console.log(`Линия: (${intersection.line.start.x},${intersection.line.start.y}) - (${intersection.line.end.x},${intersection.line.end.y})`);
        console.log(`Объект: ${intersection.object.label} (${intersection.object.type})`);
        console.log(`Позиция объекта: (${intersection.object.x},${intersection.object.y})`);
        console.log(`Размер объекта: ${intersection.object.width}x${intersection.object.height}`);
      } else if (intersection.type === 'line-line') {
        console.log(`Тип: Линия с линией`);
        console.log(`Линия 1: (${intersection.line1.start.x},${intersection.line1.start.y}) - (${intersection.line1.end.x},${intersection.line1.end.y})`);
        console.log(`Линия 2: (${intersection.line2.start.x},${intersection.line2.start.y}) - (${intersection.line2.end.x},${intersection.line2.end.y})`);
      }

      console.log(`Точки пересечения:`);
      if (intersection.points) {
        intersection.points.forEach((point, pointIndex) => {
          console.log(`  Точка ${pointIndex + 1}: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
        });
      }
    });

    if (intersections.length === 0) {
      console.log('Пересечений не найдено');
    }

    console.log('====================================');

    // Включаем отображение точек пересечения
    this.showIntersections = true;
    this.redraw();

    return intersections;
  }

  // Метод для поиска пересечений линий с другими линиями
  findLineLineIntersections() {
    const intersections = [];

    // Проверяем каждую пару линий
    for (let i = 0; i < this.lines.length; i++) {
      for (let j = i + 1; j < this.lines.length; j++) {
        const line1 = this.lines[i];
        const line2 = this.lines[j];

        // Получаем точку пересечения двух линий
        const intersection = this.getLineIntersection(
          line1.start, line1.end,
          line2.start, line2.end
        );

        if (intersection) {
          // Проверяем, что точка находится в пределах обоих отрезков
          const isOnLine1 = this.isPointOnLineSegment(intersection, line1.start, line1.end, 0.1);
          const isOnLine2 = this.isPointOnLineSegment(intersection, line2.start, line2.end, 0.1);

          if (isOnLine1 && isOnLine2) {
            intersections.push({
              type: 'line-line',
              line1: line1,
              line2: line2,
              points: [intersection]
            });
          }
        }
      }
    }

    return intersections;
  }

  // Проверка, находится ли точка на отрезке линии
  isPointOnLineSegment(point, lineStart, lineEnd, tolerance = 1) {
    // Вычисляем расстояние от точки до линии
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

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

  // Метод для вычисления пересечений линии с объектом
  getLineObjectIntersections(line, obj) {
    const intersectionPoints = [];

    // Получаем границы объекта (с учетом вращения)
    const bounds = this.getRotatedObjectBounds(obj);

    // Проверяем пересечение линии с каждой стороной прямоугольника объекта
    for (let i = 0; i < bounds.length; i++) {
      const sideStart = bounds[i];
      const sideEnd = bounds[(i + 1) % bounds.length];

      // Проверяем пересечение линии со стороной прямоугольника
      const intersection = this.getLineIntersection(
        line.start, line.end,
        sideStart, sideEnd
      );

      if (intersection) {
        // Проверяем, что точка находится в пределах отрезка линии
        if (this.isPointOnLineSegment(intersection, line.start, line.end, 0.1)) {
          intersectionPoints.push(intersection);
        }
      }
    }

    // Удаляем дубликаты (точки, которые находятся очень близко друг к другу)
    const uniquePoints = [];
    for (const point of intersectionPoints) {
      let isUnique = true;
      for (const uniquePoint of uniquePoints) {
        if (Math.abs(point.x - uniquePoint.x) < 0.1 &&
          Math.abs(point.y - uniquePoint.y) < 0.1) {
          isUnique = false;
          break;
        }
      }
      if (isUnique) {
        uniquePoints.push(point);
      }
    }

    return uniquePoints;
  }

  // Метод для получения границ объекта с учетом вращения
  getRotatedObjectBounds(obj) {
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    const angle = obj.rotation * Math.PI / 180;

    // Углы прямоугольника без вращения
    const corners = [
      { x: obj.x, y: obj.y },
      { x: obj.x + obj.width, y: obj.y },
      { x: obj.x + obj.width, y: obj.y + obj.height },
      { x: obj.x, y: obj.y + obj.height }
    ];

    // Применяем вращение к каждому углу
    return corners.map(corner => {
      // Смещаем в систему координат с центром в центре объекта
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;

      // Применяем вращение
      const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
      const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);

      // Возвращаем в глобальную систему координат
      return {
        x: rotatedX + centerX,
        y: rotatedY + centerY
      };
    });
  }

  // Метод для нахождения пересечения двух отрезков
  getLineIntersection(p1, p2, p3, p4) {
    // Проверяем, параллельны ли отрезки
    const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

    if (Math.abs(denominator) < 0.001) {
      return null; // Отрезки параллельны или коллинеарны
    }

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

    // Проверяем, находится ли точка пересечения в пределах отрезков
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y)
      };
    }

    return null; // Пересечение за пределами отрезков
  }

  // Метод для автоматического разделения пересекающихся линий
  splitAllIntersectingLines() {
    const linesToSplit = [];

    // Находим все пересечения между линиями
    for (let i = 0; i < this.lines.length; i++) {
      for (let j = i + 1; j < this.lines.length; j++) {
        const line1 = this.lines[i];
        const line2 = this.lines[j];

        // Проверяем пересечение линий
        const intersection = this.getLineIntersection(
          line1.start, line1.end,
          line2.start, line2.end
        );

        if (intersection) {
          // Проверяем, что точка пересечения не слишком близко к концам линий
          const isAtLine1Start = this.distance(intersection, line1.start) < 0.1;
          const isAtLine1End = this.distance(intersection, line1.end) < 0.1;
          const isAtLine2Start = this.distance(intersection, line2.start) < 0.1;
          const isAtLine2End = this.distance(intersection, line2.end) < 0.1;

          // Запоминаем линии для разделения
          if (!isAtLine1Start && !isAtLine1End) {
            linesToSplit.push({ line: line1, point: intersection });
          }
          if (!isAtLine2Start && !isAtLine2End) {
            linesToSplit.push({ line: line2, point: intersection });
          }
        }
      }
    }

    // Разделяем линии
    linesToSplit.forEach(({ line, point }) => {
      this.splitLine(line, point);
    });

    return linesToSplit.length > 0;
  }

  // Разделение линии на две части
  splitLine(line, splitPoint) {
    // Проверяем, что точка разделения не слишком близко к концам линии
    const distToStart = this.distance(splitPoint, line.start);
    const distToEnd = this.distance(splitPoint, line.end);

    if (distToStart < 1 || distToEnd < 1) {
      return; // Не разделяем, если точка слишком близко к концу
    }

    // Создаем две новые линии на основе исходной
    const line1 = {
      ...line,
      id: Date.now() + Math.random(),
      start: { ...line.start },
      end: { ...splitPoint }
    };

    const line2 = {
      ...line,
      id: Date.now() + Math.random() + 1,
      start: { ...splitPoint },
      end: { ...line.end }
    };

    // Удаляем исходную линию и добавляем две новые
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

    // Привязка к сетке
    if (this.snapToGrid) {
      snappedX = Math.round(x / this.gridSize) * this.gridSize;
      snappedY = Math.round(y / this.gridSize) * this.gridSize;
    }

    // Привязка к точкам линий и объектов
    if (this.snapToPoints) {
      let closestDistance = 15;
      let closestPoint = null;

      // Проверка точек линий
      this.lines.forEach(line => {
        [line.start, line.end].forEach(point => {
          const distance = Math.sqrt(
            Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
          );
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = point;
          }
        });
      });

      // Проверка углов объектов
      this.objects.forEach(obj => {
        const points = [
          { x: obj.x, y: obj.y },
          { x: obj.x + obj.width, y: obj.y },
          { x: obj.x, y: obj.y + obj.height },
          { x: obj.x + obj.width, y: obj.y + obj.height }
        ];

        points.forEach(point => {
          const distance = Math.sqrt(
            Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
          );
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

    return { x: snappedX, y: snappedY };
  }

  handleMouseDown(e) {
    const mousePos = this.getMousePos(e);
    const snappedPos = this.snapPosition(mousePos.x, mousePos.y);

    // Если выбран тип объекта и мы в режиме рисования, добавляем объект
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
    if (this.mode === 'draw') {
      this.finishDrawing();
    }
  }

  handleDoubleClick(e) {
    if (this.mode !== 'edit') return;

    const mousePos = this.getMousePos(e);
    const snappedPos = this.snapPosition(mousePos.x, mousePos.y);
    const line = this.findLineAtPoint(snappedPos);

    if (line) {
      this.startLengthEditing(line, snappedPos);
    }
  }

  // Рисование линий
  startDrawing(pos) {
    this.isDrawing = true;
    this.tempLine = {
      start: { ...pos },
      end: { ...pos },
      color: this.lineColor,
      width: this.lineWidth,
      cheight: this.cheight,
      cwidth: this.cwidth,
      cvolume: this.cvolume,
    };
  }

  continueDrawing(pos) {
    if (this.isDrawing && this.tempLine) {
      this.tempLine.end = { ...pos };
      this.redraw();
    }
  }

  finishDrawing() {
    if (this.isDrawing && this.tempLine) {
      const dx = this.tempLine.end.x - this.tempLine.start.x;
      const dy = this.tempLine.end.y - this.tempLine.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 5) {
        // Добавляем новую линию
        this.lines.push({
          ...this.tempLine,
          id: Date.now() + Math.random()
        });

        // Автоматически разделяем все пересекающиеся линии
        this.splitAllIntersectingLines();
      }

      this.tempLine = null;
      this.isDrawing = false;
      this.redraw();
    }
  }

  // Перемещение
  startMoving(pos) {
    // Сначала проверяем объекты
    this.selectedElement = this.findObjectAtPoint(pos);
    if (this.selectedElement) {
      this.isMoving = true;
      this.dragOffset = {
        x: pos.x - this.selectedElement.x,
        y: pos.y - this.selectedElement.y
      };
      return;
    }

    // Затем проверяем линии
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
        // Это линия
        const newStartX = pos.x - this.dragOffset.x;
        const newStartY = pos.y - this.dragOffset.y;

        const deltaX = newStartX - this.selectedElement.start.x;
        const deltaY = newStartY - this.selectedElement.start.y;

        this.selectedElement.start.x = newStartX;
        this.selectedElement.start.y = newStartY;
        this.selectedElement.end.x += deltaX;
        this.selectedElement.end.y += deltaY;
      } else {
        // Это объект - используем метод setPosition
        this.selectedElement.setPosition(
          pos.x - this.dragOffset.x,
          pos.y - this.dragOffset.y
        );
      }

      this.redraw();
    }
  }

  // Редактирование - перемещение отдельных точек линии
  startEditing(pos) {
    // Сначала проверяем объекты
    this.selectedElement = this.findObjectAtPoint(pos);
    if (this.selectedElement) {
      // Показываем панель свойств для выбранного объекта
      this.showPropertiesPanel(this.selectedElement);
      return;
    }

    // Затем проверяем линии - ищем ближайшую точку линии
    this.selectedElement = this.findLineAtPoint(pos);
    if (this.selectedElement) {
      // Определяем, какую точку линии мы хотим перемещать
      const distToStart = this.distance(pos, this.selectedElement.start);
      const distToEnd = this.distance(pos, this.selectedElement.end);

      // Если клик близко к одной из точек, перемещаем эту точку
      if (distToStart < 10 || distToEnd < 10) {
        this.isEditing = true;
        this.editingPoint = distToStart < distToEnd ? 'start' : 'end';

        // Устанавливаем смещение для плавного перемещения
        const targetPoint = this.selectedElement[this.editingPoint];
        this.dragOffset = {
          x: pos.x - targetPoint.x,
          y: pos.y - targetPoint.y
        };
      } else {
        // Если клик не близко к точкам, показываем панель свойств
        this.showLinePropertiesPanel(this.selectedElement);
      }
      return;
    }

    // Если кликнули не на объект и не на линию, скрываем панели свойств
    this.hidePropertiesPanel();
    this.hideLinePropertiesPanel();
  }

  continueEditing(pos) {
    if (this.isEditing && this.selectedElement && this.editingPoint) {
      // Перемещаем только выбранную точку линии
      const targetPoint = this.selectedElement[this.editingPoint];
      targetPoint.x = pos.x - this.dragOffset.x;
      targetPoint.y = pos.y - this.dragOffset.y;

      // Применяем привязку к сетке
      if (this.snapToGrid) {
        const snappedPos = this.snapPosition(targetPoint.x, targetPoint.y);
        targetPoint.x = snappedPos.x;
        targetPoint.y = snappedPos.y;
      }

      this.redraw();
    }
  }

  // Удаление
  deleteAtPosition(pos) {
    // Сначала проверяем объекты
    const objectToDelete = this.findObjectAtPoint(pos);
    if (objectToDelete) {
      this.objects = this.objects.filter(obj => obj !== objectToDelete);
      this.hidePropertiesPanel();
      this.updateStats();
      this.redraw();
      return;
    }

    // Затем проверяем линии
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
    this.dragOffset = { x: 0, y: 0 };
  }

  // Редактирование длины линии
  startLengthEditing(line, pos) {
    this.editingLength = true;
    this.selectedElement = line;

    // Удаляем старый оверлей, если есть
    if (this.lengthEditOverlay) {
      document.body.removeChild(this.lengthEditOverlay);
    }

    // Создаем новый оверлей
    this.lengthEditOverlay = document.createElement('div');
    this.lengthEditOverlay.className = 'length-edit-overlay';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = line.customLength || '';
    input.placeholder = 'Длина в m';

    const button = document.createElement('button');
    button.textContent = 'OK';

    // Позиционируем оверлей
    const rect = this.canvas.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageXOffset || document.documentElement.scrollTop;

    this.lengthEditOverlay.style.left = (rect.left + pos.x + scrollX) + 'px';
    this.lengthEditOverlay.style.top = (rect.top + pos.y + scrollY) + 'px';

    // Добавляем элементы в оверлей
    this.lengthEditOverlay.appendChild(input);
    this.lengthEditOverlay.appendChild(button);
    document.body.appendChild(this.lengthEditOverlay);

    // Фокусируемся на поле ввода
    input.focus();
    input.select();

    // Обработчики событий
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
      if (e.key === 'Enter') {
        applyLength();
      } else if (e.key === 'Escape') {
        cancelLength();
      }
    });

    // Закрытие при клике вне оверлея
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

  // Поиск элементов
  findLineAtPoint(pos, tolerance = 10) {
    for (let line of this.lines) {
      // Проверяем точки начала и конца
      if (this.distance(pos, line.start) < tolerance ||
        this.distance(pos, line.end) < tolerance) {
        return line;
      }

      // Проверяем, находится ли точка на самой линии
      if (this.isPointOnLine(pos, line, tolerance)) {
        return line;
      }
    }
    return null;
  }

  // Проверка, находится ли точка на линии
  isPointOnLine(point, line, tolerance = 10) {
    const { start, end } = line;

    // Вычисляем расстояние от точки до линии
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

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
      // Используем метод isPointInside из родительского класса
      if (obj.isPointInside(pos.x, pos.y)) {
        return obj;
      }
    }
    return null;
  }

  isPointInObject(point, obj) {
    return point.x >= obj.x && point.x <= obj.x + obj.width &&
      point.y >= obj.y && point.y <= obj.y + obj.height;
  }

  distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  calculateLineLength(line) {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Отрисовка
  redraw() {
    // Очистка canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Рисование сетки
    if (this.snapToGrid) {
      this.drawGrid();
    }

    // Рисование всех линий
    this.lines.forEach(line => {
      this.drawLine(line);
      this.drawLengthInfo(line);
      this.drawLineProperties(line);
    });

    // Рисование объектов
    this.objects.forEach(obj => {
      this.drawObject(obj);
    });

    // Рисование временной линии
    if (this.tempLine) {
      this.drawLine(this.tempLine);
    }

    // Рисование точек пересечений (если включено)
    if (this.showIntersections && this.intersectionPoints.length > 0) {
      this.drawIntersectionPoints();
    }

    // Подсветка выбранного элемента
    if (this.selectedElement) {
      this.highlightElement(this.selectedElement);
    }
  }

  // Метод для рисования точек пересечений
  drawIntersectionPoints() {
    this.intersectionPoints.forEach((point, index) => {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      this.ctx.fill();

      // Подпись точки с номером
      this.ctx.fillStyle = 'red';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      this.ctx.fillText(
        `${index + 1} (${point.x.toFixed(0)},${point.y.toFixed(0)})`,
        point.x,
        point.y - 8
      );
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

    // Отображаем пользовательскую длину, если она задана
    if (line.customLength !== undefined) {
      this.ctx.fillStyle = 'red';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(`${line.customLength}m`, midPoint.x, midPoint.y - 15);
    } else {
      // Иначе отображаем реальную длину в метрах
      const realLength = this.calculateLineLength(line);
      this.ctx.fillStyle = 'black';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`${realLength.toFixed(1)}m`, midPoint.x, midPoint.y - 15);
    }

    this.ctx.restore();
  }

  // Отрисовка дополнительных свойств линии
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
      // Просто вызываем метод draw объекта
      obj.draw(this.ctx);
    } catch (error) {
      console.error('Ошибка при отрисовке объекта:', error);
      // Рисуем fallback-прямоугольник при ошибке
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
      // Это линия
      const bounds = this.getLineBounds(element);
      this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

      // Точки начала и конца
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(element.start.x, element.start.y, 5, 0, 2 * Math.PI);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(element.end.x, element.end.y, 5, 0, 2 * Math.PI);
      this.ctx.fill();
    } else {
      // Это объект
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

  // Добавление объектов
  addObject(type, x, y) {
    // Используем фабрику для создания объекта
    const obj = ObjectFactory.createObject(type, x, y);
    this.objects.push(obj);

    // ГАРАНТИРОВАННАЯ ПЕРЕРИСОВКА: Сразу перерисовываем холст
    this.redraw();

    // ДОПОЛНИТЕЛЬНАЯ ПЕРЕРИСОВКА: Если это ImageObject, устанавливаем callback для перерисовки после загрузки изображения
    if (obj instanceof ImageObject) {
      obj.onImageLoad = () => {
        this.redraw();
      };

      // Если изображение уже загружено, перерисовываем еще раз
      if (obj.imageLoaded) {
        this.redraw();
      }
    }
  }

  // Сохранение в PDF
  saveAsPDF() {
    // Проверяем, загружена ли библиотека jsPDF
    if (typeof window.jspdf === 'undefined') {
      alert('Библиотека jsPDF не загружена. Пожалуйста, проверьте подключение к интернету.');
      return;
    }

    // Создаем новый PDF документ
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Получаем данные canvas в формате изображения
    const canvas = this.canvas;
    const imgData = canvas.toDataURL('image/png');

    // Получаем размеры canvas
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Размеры страницы PDF (A4)
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Вычисляем масштаб для размещения изображения на странице
    const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
    const scaledWidth = canvasWidth * ratio;
    const scaledHeight = canvasHeight * ratio;

    // Центрируем изображение на странице
    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;

    // Добавляем изображение в PDF
    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

    // Добавляем дату и информацию о проекте
    const currentDate = new Date().toLocaleDateString('ru-RU');
    pdf.setFontSize(10);
    pdf.text(`Дата создания: ${currentDate}`, 10, 10);
    pdf.text(`Всего линий: ${this.lines.length}`, 10, 20);
    pdf.text(`Всего объектов: ${this.objects.length}`, 10, 30);

    // Добавляем информацию о пересечениях
    if (this.intersectionPoints.length > 0) {
      pdf.text(`Точек пересечения: ${this.intersectionPoints.length}`, 10, 40);
    }

    // Сохраняем PDF
    pdf.save('чертеж.pdf');
  }

  // Метод для получения информации о выбранном объекте
  getSelectedObjectInfo() {
    if (this.selectedElement && this.selectedElement instanceof CanvasObject) {
      return this.selectedElement.getProperties();
    }
    return null;
  }

  // Метод для изменения размера объекта
  resizeSelectedObject(newWidth, newHeight) {
    if (this.selectedElement && this.selectedElement instanceof CanvasObject) {
      this.selectedElement.setSize(newWidth, newHeight);
      this.redraw();
    }
  }

  // Обновление статистики в UI
  updateStats() {
    // document.getElementById('objectsCount').textContent = this.objects.length;
    // document.getElementById('linesCount').textContent = this.lines.length;
    // document.getElementById('intersectionsCount').textContent = this.intersectionPoints.length;
  }
}

// Инициализация редактора
document.addEventListener('DOMContentLoaded', () => {
  const editor = new Editor('drawingCanvas');
  window.editor = editor; // Для отладки

  // ДОПОЛНИТЕЛЬНАЯ ПЕРЕРИСОВКА: Принудительная перерисовка после полной загрузки страницы
  setTimeout(() => {
    editor.redraw();
  }, 100);
});