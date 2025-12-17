// =============================================
// УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =============================================

const generateId = () => Date.now() + Math.random();

const Geometry = {
	distance: (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y),

	isPointOnLineSegment: (point, lineStart, lineEnd, tolerance = 3) => {
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

		return Geometry.distance(point, { x: xx, y: yy }) < tolerance;
	},

	getLineIntersection: (p1, p2, p3, p4) => {
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
	},

	rotatePoint: (point, center, angle) => {
		const rad = angle * Math.PI / 180;
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);
		const translatedX = point.x - center.x;
		const translatedY = point.y - center.y;

		return {
			x: center.x + translatedX * cos - translatedY * sin,
			y: center.y + translatedX * sin + translatedY * cos
		};
	}
};

const Snap = {
	snapToGrid: (x, y, gridSize) => ({
		x: Math.round(x / gridSize) * gridSize,
		y: Math.round(y / gridSize) * gridSize
	}),

	findClosestPoint: (x, y, points, maxDistance) => {
		let closestDistance = maxDistance;
		let closestPoint = null;

		points.forEach(point => {
			const distance = Geometry.distance({ x, y }, point);
			if (distance < closestDistance) {
				closestDistance = distance;
				closestPoint = point;
			}
		});

		return closestPoint;
	}
};

// =============================================
// КЛАССЫ ОБЪЕКТОВ
// =============================================

const createCanvasObject = (type, x, y, width, height, color = '#3498db', label = 'Объект') => {
	const state = {
		id: generateId(),
		type,
		x: x - width / 2,
		y: y - height / 2,
		width,
		height,
		color,
		label,
		selected: false,
		properties: {},
		image: null,
		imageLoaded: false,
		rotation: 0
	};

	const getCenter = () => ({
		x: state.x + state.width / 2,
		y: state.y + state.height / 2
	});

	const getVertices = () => {
		const center = getCenter();
		const halfWidth = state.width / 2;
		const halfHeight = state.height / 2;
		const angle = state.rotation * Math.PI / 180;

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
	};

	const getSides = () => {
		const vertices = getVertices();
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
	};

	const loadImage = (imageUrl) => {
		return new Promise((resolve, reject) => {
			state.image = new Image();
			state.image.onload = () => {
				state.imageLoaded = true;
				resolve();
			};
			state.image.onerror = () => {
				state.imageLoaded = false;
				reject(new Error('Не удалось загрузить изображение'));
			};
			state.image.src = imageUrl;
		});
	};

	const isPointInside = (x, y) => {
		const center = getCenter();
		const angle = -state.rotation * Math.PI / 180;

		const translatedX = x - center.x;
		const translatedY = y - center.y;

		const rotatedX = translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
		const rotatedY = translatedX * Math.sin(angle) + translatedY * Math.cos(angle);

		return Math.abs(rotatedX) <= state.width / 2 &&
			Math.abs(rotatedY) <= state.height / 2;
	};

	const draw = (ctx) => {
		if (state.image && state.imageLoaded) {
			ctx.save();
			const centerX = state.x + state.width / 2;
			const centerY = state.y + state.height / 2;
			ctx.translate(centerX, centerY);
			ctx.rotate((state.rotation * Math.PI) / 180);
			ctx.drawImage(state.image, -state.width / 2, -state.height / 2, state.width, state.height);
			ctx.restore();
		} else {
			ctx.fillStyle = state.color;
			ctx.fillRect(state.x, state.y, state.width, state.height);
			ctx.fillStyle = 'white';
			ctx.font = '10px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(state.label, state.x + state.width / 2, state.y + state.height / 2);
		}

		if (state.selected) {
			drawSelection(ctx);
		}
	};

	const drawSelection = (ctx) => {
		ctx.strokeStyle = '#ff0000';
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 5]);
		ctx.strokeRect(state.x - 5, state.y - 5, state.width + 10, state.height + 10);
		ctx.fillStyle = '#ff0000';
		ctx.font = '10px Arial';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.fillText(`${state.rotation}°`, state.x - 5, state.y - 15);
		ctx.setLineDash([]);
	};

	return {
		getId: () => state.id,
		getType: () => state.type,
		getCenter,
		getVertices,
		getSides,
		getProperties: () => ({
			type: state.type,
			x: state.x,
			y: state.y,
			width: state.width,
			height: state.height,
			color: state.color,
			label: state.label,
			rotation: state.rotation,
			...state.properties
		}),

		setPosition: (x, y) => {
			state.x = x - state.width / 2;
			state.y = y - state.height / 2;
		},
		setSize: (width, height) => {
			const center = getCenter();
			state.width = width;
			state.height = height;
			state.x = center.x - width / 2;
			state.y = center.y - height / 2;
		},
		setLabel: (label) => { state.label = label; },
		setRotation: (rotation) => { state.rotation = rotation; },
		setSelected: (selected) => { state.selected = selected; },

		isPointInside,
		rotate: (degrees = 90) => {
			state.rotation = (state.rotation + degrees) % 360;
		},
		loadImage,
		draw,
		getState: () => ({ ...state })
	};
};

const createImageObject = (type, x, y, width, height, imageUrl, label = 'Объект') => {
	const baseObject = createCanvasObject(type, x, y, width, height, '#3498db', label);
	const baseState = baseObject.getState();

	const state = {
		...baseState,
		properties: { imageUrl },
		imageLoading: false,
		onImageLoad: null
	};

	const loadImageAsync = async () => {
		if (!imageUrl) return;
		state.imageLoading = true;
		try {
			await baseObject.loadImage(imageUrl);
			state.image = baseObject.getState().image;
			state.imageLoaded = baseObject.getState().imageLoaded;
		} catch (error) {
			console.error('Ошибка загрузки изображения:', error);
		} finally {
			state.imageLoading = false;
			if (state.onImageLoad) state.onImageLoad();
		}
	};

	if (imageUrl) {
		loadImageAsync();
	}

	const drawImage = (ctx) => {
		ctx.save();
		const centerX = state.x + state.width / 2;
		const centerY = state.y + state.height / 2;
		ctx.translate(centerX, centerY);
		ctx.rotate((state.rotation * Math.PI) / 180);
		ctx.drawImage(state.image, -state.width / 2, -state.height / 2, state.width, state.height);
		ctx.restore();
	};

	const drawPlaceholder = (ctx) => {
		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(state.x, state.y, state.width, state.height);
		ctx.strokeStyle = '#999';
		ctx.lineWidth = 1;
		ctx.strokeRect(state.x, state.y, state.width, state.height);
		ctx.fillStyle = '#999';
		ctx.font = '10px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(state.label, state.x + state.width / 2, state.y + state.height / 2);
	};

	const drawLabel = (ctx) => {
		ctx.fillStyle = 'black';
		ctx.font = '10px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(state.label, state.x + state.width / 2, state.y + state.height + 5);
	};

	const draw = (ctx) => {
		if (state.image && state.imageLoaded) {
			drawImage(ctx);
		} else {
			drawPlaceholder(ctx);
		}
		drawLabel(ctx);

		if (state.selected) {
			baseObject.drawSelection(ctx);
		}
	};

	return {
		...baseObject,
		loadImageAsync,
		setOnImageLoad: (callback) => { state.onImageLoad = callback; },
		getImageLoaded: () => state.imageLoaded,
		draw,
		getState: () => ({ ...state })
	};
};

// =============================================
// МЕНЕДЖЕР ТОЧЕК ПЕРЕСЕЧЕНИЯ
// =============================================

const createIntersectionManager = () => {
	let nextId = 1;

	const createPoint = (x, y) => {
		const point = {
			id: nextId++,
			x,
			y,
			intersections: [],
			formula: 0
		};

		return {
			...point,
			isNear: (otherPoint, tolerance = 5) => {
				const dx = point.x - otherPoint.x;
				const dy = point.y - otherPoint.y;
				return Math.sqrt(dx * dx + dy * dy) < tolerance;
			},
			getInfo: () => ({
				id: point.id,
				x: point.x,
				y: point.y,
				intersectionCount: point.intersections.length,
				intersections: point.intersections,
				formula: point.formula
			})
		};
	};

	return {
		createPoint,
		resetCounter: () => { nextId = 1; },
		getNextId: () => nextId
	};
};

// =============================================
// ФАБРИКА ОБЪЕКТОВ
// =============================================

const createObjectFactory = () => {
	const objectConfigs = {
		'door': {
			width: 30, height: 30,
			image: './img/dvercloses.png',
			label: 'Дверь закрытая',
			category: 'doors_windows'
		},
		'door2': {
			width: 30, height: 30,
			image: './img/dverwentoknowood.png',
			label: 'Дверь деревянная с вентоткном',
			category: 'doors_windows'
		},
		'door3': {
			width: 40, height: 30,
			image: './img/dverventrech.png',
			label: 'Дверь с вентрешеткой',
			category: 'doors_windows'
		},
		'door4': {
			width: 30, height: 30,
			image: './img/dveropenmetall.png',
			label: 'Дверь металлическая открытая',
			category: 'doors_windows'
		},
		'fan': {
			width: 40, height: 40,
			image: './img/fan.png',
			label: 'Вентилятор основной',
			category: 'fan'
		},
		'fan2': {
			width: 40, height: 40,
			image: './img/fan2.png',
			label: 'Вентилятор',
			category: 'fan'
		},
		'fire': {
			width: 40, height: 40,
			image: './img/fire.png',
			label: 'Огонь',
			category: 'fire'
		},
		'fire2': {
			width: 40, height: 40,
			image: './img/pozarniigidrant.png',
			label: 'Пожарный гидрант',
			category: 'fire'
		},
		'boom': {
			width: 40, height: 40,
			image: './img/massovievzivniepaboti.png',
			label: 'Массовые взрывные работы',
			category: 'boom'
		},
		'boom2': {
			width: 40, height: 40,
			image: './img/vzrivnieraboti.png',
			label: 'Взрывные работы',
			category: 'boom'
		},
		'medical': {
			width: 40, height: 40,
			image: './img/medpunkt.png',
			label: 'Медицинский пункт',
			category: 'medical'
		},
		'building': {
			width: 30, height: 30,
			image: './img/nadshahtnoe.png',
			label: 'Надшахтное строение',
			category: 'building'
		},
		'pumps': {
			width: 40, height: 40,
			image: './img/nanospogruznoi.png',
			label: 'Насос погружной',
			category: 'pumps'
		},
		'pumps2': {
			width: 40, height: 40,
			image: './img/nasosnayastancia.png',
			label: 'Насосная станция',
			category: 'pumps'
		},
		'people': {
			width: 40, height: 40,
			image: './img/people.png',
			label: 'Люди',
			category: 'people'
		},
		'jumper': {
			width: 30, height: 30,
			image: './img/petemichkabeton.png',
			label: 'Перемычка бетонная',
			category: 'jumper'
		},
		'jumper2': {
			width: 30, height: 30,
			image: './img/petemichkakirpich.png',
			label: 'Перемычка кирпичная',
			category: 'jumper'
		},
		'jumper3': {
			width: 30, height: 30,
			image: './img/petemichkametall.png',
			label: 'Перемычка металлическая',
			category: 'jumper'
		},
		'jumper4': {
			width: 30, height: 30,
			image: './img/petemichkawood.png',
			label: 'Перемычка деревянная',
			category: 'jumper'
		},
		'phone': {
			width: 40, height: 40,
			image: './img/phone.png',
			label: 'Телефон',
			category: 'phone'
		},
		'equipment': {
			width: 40, height: 40,
			image: './img/samohodnoe.png',
			label: 'Самоходное оборудование',
			category: 'equipment'
		},
		'entrance': {
			width: 40, height: 20,
			image: './img/zapasvhod.png',
			label: 'Запасной вход',
			category: 'entrance'
		}
	};

	return {
		createObject: (type, x, y) => {
			const config = objectConfigs[type];
			if (config) {
				return createImageObject(type, x, y, config.width, config.height, config.image, config.label);
			}
			return createCanvasObject('generic', x, y, 50, 50, '#3498db', 'Объект');
		},
		getObjectTypes: () => Object.entries(objectConfigs).map(([type, config]) => ({
			type,
			name: config.label,
			icon: config.image,
			category: config.category
		})),
		getObjectConfig: (type) => objectConfigs[type]
	};
};

// =============================================
// РЕДАКТОР (ЯДРО)
// =============================================

const createEditorCore = (canvasId) => {
	// Состояние редактора
	let state = {
		canvas: document.getElementById(canvasId),
		ctx: null,
		bufferCanvas: document.createElement('canvas'),
		bufferCtx: null,
		needsRedraw: true,

		// Настройки
		mode: 'draw',
		lineColor: '#ffffff',
		lineWidth: 10,
		snapToGrid: true,
		snapToPoints: true,
		gridSize: 20,
		currentObjectType: null,

		// Состояния
		isDrawing: false,
		isMoving: false,
		isEditing: false,
		selectedElement: null,
		dragOffset: { x: 0, y: 0 },
		editingPoint: null,
		editingLength: false,
		lengthEditOverlay: null,

		// Данные
		lines: [],
		objects: [],
		tempLine: null,
		intersectionPoints: [],
		intersectionInfo: [],

		// Флаги отображения
		showIntersections: false,
		showTrackProperties: false,
		showEndpoints: true,

		// Оптимизация
		lastDrawnTempLine: null,
		tempLineDrawn: false,
		animationFrameId: null,
		mousePos: { x: 0, y: 0 }
	};

	// =============================================
	// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ РЕДАКТОРА
	// =============================================

	// Функция для применения свойств линии
	const applyLineProperties = () => {
		if (!state.selectedElement || !state.selectedElement.start) {
			console.warn('Не выбрана линия для редактирования');
			return;
		}

		const cheightInput = document.getElementById('lineCheight');
		const cwidthInput = document.getElementById('lineCwidth');
		const cvolumeInput = document.getElementById('lineCvolume');

		if (!cheightInput || !cwidthInput || !cvolumeInput) {
			console.warn('Не найдены элементы ввода свойств линии');
			return;
		}

		state.selectedElement.cheight = cheightInput.value ? parseFloat(cheightInput.value) : null;
		state.selectedElement.cwidth = cwidthInput.value ? parseFloat(cwidthInput.value) : null;
		state.selectedElement.cvolume = cvolumeInput.value ? parseFloat(cvolumeInput.value) : null;

		state.needsRedraw = true;
		redraw();
		hideLinePropertiesPanel();

		console.log('Свойства линии обновлены:', {
			cheight: state.selectedElement.cheight,
			cwidth: state.selectedElement.cwidth,
			cvolume: state.selectedElement.cvolume
		});
	};

	// Функция для отображения панели свойств линии
	const showLinePropertiesPanel = (line) => {
		const panel = document.getElementById('linePropertiesPanel');
		const cheightInput = document.getElementById('lineCheight');
		const cwidthInput = document.getElementById('lineCwidth');
		const cvolumeInput = document.getElementById('lineCvolume');
		const lengthInput = document.getElementById('lineLength');

		if (!panel || !cheightInput || !cwidthInput || !cvolumeInput || !lengthInput) {
			console.warn('Не найдены элементы панели свойств линии');
			return;
		}

		cheightInput.value = line.cheight || '';
		cwidthInput.value = line.cwidth || '';
		cvolumeInput.value = line.cvolume || '';
		lengthInput.value = `${Geometry.distance(line.start, line.end).toFixed(1)}m`;

		panel.style.display = 'block';

		// Сохраняем ссылку на выбранную линию
		state.selectedElement = line;

		console.log('Открыта панель свойств линии:', line);
	};

	// Функция для скрытия панели свойств линии
	const hideLinePropertiesPanel = () => {
		const panel = document.getElementById('linePropertiesPanel');
		if (panel) {
			panel.style.display = 'none';
		}
		state.selectedElement = null;
	};

	// Функция для отображения панели свойств объекта
	const showPropertiesPanel = (obj) => {
		const panel = document.getElementById('propertiesPanel');
		const labelInput = document.getElementById('propertyLabel');
		const widthInput = document.getElementById('propertyWidth');
		const heightInput = document.getElementById('propertyHeight');

		if (!panel || !labelInput || !widthInput || !heightInput) {
			console.warn('Не найдены элементы панели свойств объекта');
			return;
		}

		const objState = obj.getState();
		labelInput.value = objState.label;
		widthInput.value = objState.width;
		heightInput.value = objState.height;

		panel.style.display = 'block';
		state.selectedElement = obj;

		console.log('Открыта панель свойств объекта:', objState);
	};

	// Функция для скрытия панели свойств объекта
	const hidePropertiesPanel = () => {
		const panel = document.getElementById('propertiesPanel');
		if (panel) {
			panel.style.display = 'none';
		}
		state.selectedElement = null;
	};

	// Функция для применения свойств объекта
	const applyObjectProperties = () => {
		if (!state.selectedElement) {
			console.warn('Не выбран объект для редактирования');
			return;
		}

		const labelInput = document.getElementById('propertyLabel');
		const widthInput = document.getElementById('propertyWidth');
		const heightInput = document.getElementById('propertyHeight');

		if (!labelInput || !widthInput || !heightInput) {
			console.warn('Не найдены элементы ввода свойств объекта');
			return;
		}

		state.selectedElement.setLabel(labelInput.value);
		state.selectedElement.setSize(parseInt(widthInput.value), parseInt(heightInput.value));

		state.needsRedraw = true;
		redraw();

		console.log('Свойства объекта обновлены:', {
			label: labelInput.value,
			width: widthInput.value,
			height: heightInput.value
		});
	};

	// Функция для поворота выбранного объекта
	const rotateSelectedObject = () => {
		if (!state.selectedElement) {
			console.warn('Не выбран объект для поворота');
			return;
		}

		state.selectedElement.rotate(90);
		state.needsRedraw = true;
		redraw();

		console.log('Объект повернут на 90 градусов');
	};

	// =============================================
	// ИНИЦИАЛИЗАЦИЯ И ОСНОВНЫЕ ФУНКЦИИ
	// =============================================

	const init = () => {
		state.ctx = state.canvas.getContext('2d');
		state.bufferCtx = state.bufferCanvas.getContext('2d');

		setupEventListeners();
		setupUI();
		setupObjectLibrary();
		handleResize();
		redraw();
	};

	// =============================================
	// ОБРАБОТЧИКИ СОБЫТИЙ
	// =============================================

	const setupEventListeners = () => {
		const events = [
			['mousedown', handleMouseDown],
			['mousemove', handleMouseMove],
			['mouseup', handleMouseUp],
			['mouseout', handleMouseOut],
			['dblclick', handleDoubleClick],
			['click', handleClick]
		];

		events.forEach(([event, handler]) => {
			state.canvas.addEventListener(event, handler);
		});

		window.addEventListener('resize', handleResize);
	};

	const getMousePos = (e) => {
		const rect = state.canvas.getBoundingClientRect();
		const scaleX = state.canvas.width / rect.width;
		const scaleY = state.canvas.height / rect.height;

		state.mousePos = {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY
		};

		return state.mousePos;
	};

	const snapPosition = (x, y) => {
		let snappedX = x;
		let snappedY = y;

		if (state.snapToGrid) {
			snappedX = Math.round(x / state.gridSize) * state.gridSize;
			snappedY = Math.round(y / state.gridSize) * state.gridSize;
		}

		if (state.snapToPoints) {
			const allPoints = getAllPoints();
			const closestPoint = Snap.findClosestPoint(x, y, allPoints, 15);
			if (closestPoint) {
				snappedX = closestPoint.x;
				snappedY = closestPoint.y;
			}
		}

		return { x: snappedX, y: snappedY };
	};

	const getAllPoints = () => {
		const points = [];

		// Точки из линий
		state.lines.forEach(line => {
			points.push(line.start, line.end);
		});

		// Центры объектов
		state.objects.forEach(obj => {
			points.push(obj.getCenter());
		});

		// Точки пересечения
		state.intersectionPoints.forEach(point => {
			points.push({ x: point.x, y: point.y });
		});

		return points;
	};

	const handleMouseDown = (e) => {
		const mousePos = getMousePos(e);
		const snappedPos = snapPosition(mousePos.x, mousePos.y);

		// Добавление объектов при режиме draw и выбранном типе объекта
		if (state.mode === 'draw' && state.currentObjectType) {
			addObject(state.currentObjectType, snappedPos.x, snappedPos.y);
			return;
		}

		switch (state.mode) {
			case 'draw': startDrawing(snappedPos); break;
			case 'move': startMoving(snappedPos); break;
			case 'edit': startEditing(snappedPos); break;
			case 'delete': deleteAtPosition(snappedPos); break;
		}
	};

	const handleMouseMove = (e) => {
		const mousePos = getMousePos(e);
		const snappedPos = snapPosition(mousePos.x, mousePos.y);

		switch (state.mode) {
			case 'draw': continueDrawing(snappedPos); break;
			case 'move': continueMoving(snappedPos); break;
			case 'edit': continueEditing(snappedPos); break;
		}
	};

	const handleMouseUp = () => {
		switch (state.mode) {
			case 'draw': finishDrawing(); break;
			case 'move':
			case 'edit': finishInteraction(); break;
		}
	};

	const handleMouseOut = () => {
		if (state.mode === 'draw') finishDrawing();
	};

	const handleDoubleClick = (e) => {
		if (state.mode !== 'edit') return;

		const mousePos = getMousePos(e);
		const snappedPos = snapPosition(mousePos.x, mousePos.y);
		const line = findLineAtPoint(snappedPos);

		if (line) startLengthEditing(line, snappedPos);
	};

	const handleClick = (e) => {
		const mousePos = getMousePos(e);
		const clickedPoint = findIntersectionPointAtPosition(mousePos);

		if (clickedPoint) {
			showIntersectionInfo(clickedPoint);
			e.stopPropagation();
		}
	};

	const handleResize = () => {
		const container = state.canvas.parentElement;
		const width = container.clientWidth - 40;
		const height = container.clientHeight - 80;

		if (state.canvas.width !== width || state.canvas.height !== height) {
			state.canvas.width = width;
			state.canvas.height = height;
			state.bufferCanvas.width = width;
			state.bufferCanvas.height = height;
			state.needsRedraw = true;
			redraw();
		}
	};

	// =============================================
	// РАБОТА С ЛИНИЯМИ
	// =============================================

	const startDrawing = (pos) => {
		state.isDrawing = true;
		state.tempLine = {
			id: generateId(),
			start: { ...pos },
			end: { ...pos },
			color: state.lineColor,
			width: state.lineWidth,
			track: [],
			endtrack: [],
			passability: {}
		};
		state.lastDrawnTempLine = null;
		state.tempLineDrawn = false;
	};

	const continueDrawing = (pos) => {
		if (!state.isDrawing || !state.tempLine) return;

		const dx = pos.x - state.tempLine.end.x;
		const dy = pos.y - state.tempLine.end.y;
		if (Math.hypot(dx, dy) < 1) return;

		state.tempLine.end = { ...pos };

		if (state.animationFrameId) {
			cancelAnimationFrame(state.animationFrameId);
		}

		state.animationFrameId = requestAnimationFrame(() => {
			drawTemporaryLine();
			state.animationFrameId = null;
		});
	};

	const finishDrawing = () => {
		if (state.animationFrameId) {
			cancelAnimationFrame(state.animationFrameId);
			state.animationFrameId = null;
		}

		if (state.isDrawing && state.tempLine) {
			const length = Geometry.distance(state.tempLine.start, state.tempLine.end);

			if (length > 5) {
				const newLine = { ...state.tempLine, id: generateId() };
				state.lines.push(newLine);

				// Проверяем пересечение с объектами
				checkLineObjectIntersections(newLine);

				// Разбиваем линии между собой
				const hasIntersections = splitAllIntersectingLines();

				if (hasIntersections) {
					console.log('Линии были разбиты после добавления новой линии');
				}

				state.needsRedraw = true;
				updateStats();
			}

			state.tempLine = null;
			state.lastDrawnTempLine = null;
			state.tempLineDrawn = false;
			state.isDrawing = false;
			redraw();
		}
	};

	const findLineAtPoint = (pos, tolerance = 10) => {
		for (let line of state.lines) {
			if (Geometry.distance(pos, line.start) < tolerance ||
				Geometry.distance(pos, line.end) < tolerance ||
				isPointOnLine(pos, line, tolerance)) {
				return line;
			}
		}
		return null;
	};

	const isPointOnLine = (point, line, tolerance = 10) => {
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

		return Geometry.distance(point, { x: xx, y: yy }) < tolerance;
	};

	// =============================================
	// РАБОТА С ОБЪЕКТАМИ
	// =============================================

	const findObjectAtPoint = (pos, tolerance = 5) => {
		for (let i = state.objects.length - 1; i >= 0; i--) {
			const obj = state.objects[i];
			if (obj.isPointInside(pos.x, pos.y)) {
				return obj;
			}
		}
		return null;
	};

	const addObject = (type, x, y) => {
		const objectFactory = createObjectFactory();
		const obj = objectFactory.createObject(type, x, y);
		state.objects.push(obj);

		// Находим все линии, которые пересекаются с объектом
		const lineIntersections = [];
		for (const line of state.lines) {
			const intersection = getLineObjectIntersection(line, obj);
			if (intersection) {
				lineIntersections.push({
					line: line,
					intersection: intersection
				});
			}
		}

		// Создаем точки пересечения для каждой линии
		const intersectionManager = createIntersectionManager();
		for (const item of lineIntersections) {
			const intersectionPoint = intersectionManager.createPoint(
				item.intersection.point.x,
				item.intersection.point.y
			);

			const lineEndpoint = getLineEndpointAtIntersection(
				item.line,
				item.intersection.point,
				intersectionPoint.id,
				5
			);

			intersectionPoint.intersections.push({
				type: 'line-object',
				line: item.line,
				object: obj,
				lineEndpoint: lineEndpoint,
				objectSide: item.intersection.side,
				lineId: item.line.id,
				objectId: obj.getId()
			});

			state.intersectionPoints.push(intersectionPoint);

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
		if (lineIntersections.length > 0) {
			splitLinesWithObject(obj, lineIntersections);
			console.log(`Объект добавлен, разбито линий: ${lineIntersections.length}`);
		}

		// Устанавливаем обработчик загрузки изображения
		if (obj.setOnImageLoad) {
			obj.setOnImageLoad(() => {
				state.needsRedraw = true;
				redraw();
			});
		}

		state.needsRedraw = true;
		updateStats();
		redraw();

		console.log(`Добавлен объект: ${obj.getState().label} (${type})`);
		return obj;
	};

	// =============================================
	// ПЕРЕСЕЧЕНИЯ ЛИНИЙ С ОБЪЕКТАМИ
	// =============================================

	const getLineObjectIntersection = (line, obj) => {
		const sides = obj.getSides();

		for (const side of sides) {
			const intersection = Geometry.getLineIntersection(
				line.start, line.end,
				side.start, side.end
			);

			if (intersection) {
				const isOnLine = Geometry.isPointOnLineSegment(
					intersection, line.start, line.end, 3
				);
				const isOnSide = Geometry.isPointOnLineSegment(
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
	};

	const checkLineObjectIntersections = (line) => {
		const objectIntersections = [];

		for (const obj of state.objects) {
			const intersection = getLineObjectIntersection(line, obj);
			if (intersection) {
				objectIntersections.push({
					point: intersection.point,
					object: obj,
					side: intersection.side
				});
			}
		}

		if (objectIntersections.length > 0) {
			createObjectIntersectionPoints(line, objectIntersections);
		}
	};

	const createObjectIntersectionPoints = (line, intersections) => {
		const intersectionManager = createIntersectionManager();

		for (const intersection of intersections) {
			const intersectionPoint = intersectionManager.createPoint(
				intersection.point.x,
				intersection.point.y
			);

			const lineEndpoint = getLineEndpointAtIntersection(
				line,
				intersection.point,
				intersectionPoint.id,
				5
			);

			intersectionPoint.intersections.push({
				type: 'line-object',
				line: line,
				object: intersection.object,
				lineEndpoint: lineEndpoint,
				objectSide: intersection.side,
				lineId: line.id,
				objectId: intersection.object.getId()
			});

			state.intersectionPoints.push(intersectionPoint);

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
	};

	const getLineEndpointAtIntersection = (line, intersectionPoint, intersectionId, tolerance = 5) => {
		const distToStart = Geometry.distance(intersectionPoint, line.start);
		const distToEnd = Geometry.distance(intersectionPoint, line.end);

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
	};

	// =============================================
	// ДЕЛЕНИЕ ЛИНИЙ ПРИ ДОБАВЛЕНИИ ОБЪЕКТОВ
	// =============================================

	const splitLinesWithObject = (obj, lineIntersections) => {
		const splitPointsMap = new Map();

		// Собираем все точки пересечения линий с объектом
		for (const item of lineIntersections) {
			if (!splitPointsMap.has(item.line.id)) {
				splitPointsMap.set(item.line.id, []);
			}
			splitPointsMap.get(item.line.id).push(item.intersection.point);
		}

		// Разбиваем линии по точкам пересечения
		splitLinesByPoints(splitPointsMap);

		// После разбиения обновляем свойства линий
		updateLineTrackProperties();
	};

	const splitAllIntersectingLines = () => {
		const splitPointsMap = new Map();

		// Пересечения линий с линиями
		for (let i = 0; i < state.lines.length; i++) {
			for (let j = i + 1; j < state.lines.length; j++) {
				const intersection = Geometry.getLineIntersection(
					state.lines[i].start, state.lines[i].end,
					state.lines[j].start, state.lines[j].end
				);

				if (intersection) {
					const isOnLine1 = Geometry.isPointOnLineSegment(
						intersection, state.lines[i].start, state.lines[i].end, 3
					);
					const isOnLine2 = Geometry.isPointOnLineSegment(
						intersection, state.lines[j].start, state.lines[j].end, 3
					);

					if (isOnLine1 && isOnLine2) {
						addSplitPoint(splitPointsMap, state.lines[i].id, intersection);
						addSplitPoint(splitPointsMap, state.lines[j].id, intersection);
					}
				}
			}
		}

		// Пересечения линий с объектами
		for (const line of state.lines) {
			for (const obj of state.objects) {
				const intersection = getLineObjectIntersection(line, obj);
				if (intersection) {
					const isOnLine = Geometry.isPointOnLineSegment(
						intersection.point, line.start, line.end, 3
					);
					if (isOnLine) {
						addSplitPoint(splitPointsMap, line.id, intersection.point);
					}
				}
			}
		}

		return splitLinesByPoints(splitPointsMap);
	};

	const addSplitPoint = (map, lineId, point) => {
		if (!map.has(lineId)) map.set(lineId, []);
		const points = map.get(lineId);

		let exists = false;
		for (const existingPoint of points) {
			if (Geometry.distance(existingPoint, point) < 5) {
				exists = true;
				break;
			}
		}

		if (!exists) points.push({ ...point });
	};

	const splitLinesByPoints = (splitPointsMap) => {
		const newLines = [];
		const processedLineIds = new Set();

		for (const line of state.lines) {
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

			// Сортируем точки по расстоянию от начала линии
			allPoints.sort((a, b) => {
				return Geometry.distance(a, line.start) - Geometry.distance(b, line.start);
			});

			// Удаляем дубликаты
			const uniquePoints = removeDuplicatePoints(allPoints);

			// Создаем отрезки между точками
			for (let i = 0; i < uniquePoints.length - 1; i++) {
				const segmentLength = Geometry.distance(uniquePoints[i], uniquePoints[i + 1]);
				if (segmentLength > 5) {
					const newLine = {
						...line,
						id: generateId() + i,
						start: { x: uniquePoints[i].x, y: uniquePoints[i].y },
						end: { x: uniquePoints[i + 1].x, y: uniquePoints[i + 1].y },
						track: [],
						endtrack: [],
						passability: {}
					};
					newLines.push(newLine);
				}
			}

			processedLineIds.add(line.id);
		}

		state.lines = newLines;
		return splitPointsMap.size > 0;
	};

	const removeDuplicatePoints = (points) => {
		const uniquePoints = [];
		for (const point of points) {
			let isDuplicate = false;
			for (const uniquePoint of uniquePoints) {
				if (Geometry.distance(point, uniquePoint) < 5) {
					isDuplicate = true;
					break;
				}
			}
			if (!isDuplicate) uniquePoints.push(point);
		}
		return uniquePoints;
	};

	// =============================================
	// ОБНОВЛЕНИЕ СВОЙСТВ ЛИНИЙ
	// =============================================

	const updateLineTrackProperties = () => {
		// Очищаем существующие свойства
		state.lines.forEach(line => {
			line.track = [];
			line.endtrack = [];
			line.passability = {};
		});

		// Обновляем свойства на основе точек пересечения
		state.intersectionPoints.forEach(intersectionPoint => {
			intersectionPoint.intersections.forEach(intersection => {
				if (intersection.type === 'line-line') {
					const line1 = state.lines.find(l => l.id === intersection.line1Id);
					const line2 = state.lines.find(l => l.id === intersection.line2Id);

					updateLineProperties(line1, intersection.line1Endpoint, intersectionPoint);
					updateLineProperties(line2, intersection.line2Endpoint, intersectionPoint);
				} else if (intersection.type === 'line-object') {
					const line = state.lines.find(l => l.id === intersection.lineId);
					if (line) {
						updateLineProperties(line, intersection.lineEndpoint, intersectionPoint);
					}
				}
			});
		});

		// Для линий без пересечений
		state.lines.forEach(line => {
			if (Object.keys(line.passability).length === 0) {
				line.passability.default = 0;
			}
		});
	};

	const updateLineProperties = (line, endpoint, intersectionPoint) => {
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
	};

	// =============================================
	// ПЕРЕМЕЩЕНИЕ И РЕДАКТИРОВАНИЕ
	// =============================================

	const startMoving = (pos) => {
		state.selectedElement = findObjectAtPoint(pos) || findLineAtPoint(pos);

		if (state.selectedElement) {
			state.isMoving = true;
			const targetPoint = state.selectedElement.start ?
				state.selectedElement.start : state.selectedElement.getCenter();
			state.dragOffset = {
				x: pos.x - targetPoint.x,
				y: pos.y - targetPoint.y
			};
			state.needsRedraw = true;
		}
	};

	const continueMoving = (pos) => {
		if (!state.isMoving || !state.selectedElement) return;

		if (state.selectedElement.start && state.selectedElement.end) {
			const newStartX = pos.x - state.dragOffset.x;
			const newStartY = pos.y - state.dragOffset.y;
			const deltaX = newStartX - state.selectedElement.start.x;
			const deltaY = newStartY - state.selectedElement.start.y;

			state.selectedElement.start.x = newStartX;
			state.selectedElement.start.y = newStartY;
			state.selectedElement.end.x += deltaX;
			state.selectedElement.end.y += deltaY;
		} else {
			state.selectedElement.setPosition(
				pos.x - state.dragOffset.x,
				pos.y - state.dragOffset.y
			);
		}

		state.needsRedraw = true;
		redraw();
	};

	const startEditing = (pos) => {
		const object = findObjectAtPoint(pos);
		if (object) {
			showPropertiesPanel(object);
			return;
		}

		const line = findLineAtPoint(pos);
		if (line) {
			const distToStart = Geometry.distance(pos, line.start);
			const distToEnd = Geometry.distance(pos, line.end);

			if (distToStart < 10 || distToEnd < 10) {
				state.isEditing = true;
				state.editingPoint = distToStart < distToEnd ? 'start' : 'end';
				const targetPoint = line[state.editingPoint];
				state.dragOffset = {
					x: pos.x - targetPoint.x,
					y: pos.y - targetPoint.y
				};
				state.selectedElement = line;
			} else {
				showLinePropertiesPanel(line);
			}
			return;
		}

		hidePropertiesPanel();
		hideLinePropertiesPanel();
	};

	const continueEditing = (pos) => {
		if (!state.isEditing || !state.selectedElement || !state.editingPoint) return;

		const targetPoint = state.selectedElement[state.editingPoint];
		targetPoint.x = pos.x - state.dragOffset.x;
		targetPoint.y = pos.y - state.dragOffset.y;

		if (state.snapToGrid) {
			const snappedPos = snapPosition(targetPoint.x, targetPoint.y);
			targetPoint.x = snappedPos.x;
			targetPoint.y = snappedPos.y;
		}

		state.needsRedraw = true;
		redraw();
	};

	const finishInteraction = () => {
		state.isMoving = false;
		state.isEditing = false;
		state.editingPoint = null;
		state.dragOffset = { x: 0, y: 0 };

		// После перемещения пересчитываем пересечения
		if (state.selectedElement && state.selectedElement.start && state.selectedElement.end) {
			splitAllIntersectingLines();
		}

		state.needsRedraw = true;
		redraw();
	};

	// =============================================
	// РЕДАКТИРОВАНИЕ ДЛИНЫ ЛИНИИ
	// =============================================

	const startLengthEditing = (line, pos) => {
		state.editingLength = true;
		state.selectedElement = line;

		if (state.lengthEditOverlay) {
			document.body.removeChild(state.lengthEditOverlay);
		}

		state.lengthEditOverlay = document.createElement('div');
		state.lengthEditOverlay.className = 'length-edit-overlay';

		const input = document.createElement('input');
		input.type = 'text';
		input.value = line.customLength || '';
		input.placeholder = 'Длина в m';

		const button = document.createElement('button');
		button.textContent = 'OK';

		const rect = state.canvas.getBoundingClientRect();
		const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
		const scrollY = window.pageYOffset || document.documentElement.scrollTop;

		state.lengthEditOverlay.style.left = (rect.left + pos.x + scrollX) + 'px';
		state.lengthEditOverlay.style.top = (rect.top + pos.y + scrollY) + 'px';

		state.lengthEditOverlay.appendChild(input);
		state.lengthEditOverlay.appendChild(button);
		document.body.appendChild(state.lengthEditOverlay);

		input.focus();
		input.select();

		const applyLength = () => {
			const newLength = input.value.trim();
			if (newLength && !isNaN(newLength)) {
				line.customLength = Number(newLength);
			} else {
				delete line.customLength;
			}
			state.needsRedraw = true;
			redraw();
			finishLengthEditing();
		};

		const cancelLength = () => {
			finishLengthEditing();
		};

		button.addEventListener('click', applyLength);
		input.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') applyLength();
			else if (e.key === 'Escape') cancelLength();
		});

		setTimeout(() => {
			const closeHandler = (e) => {
				if (state.lengthEditOverlay && !state.lengthEditOverlay.contains(e.target)) {
					finishLengthEditing();
					document.removeEventListener('mousedown', closeHandler);
				}
			};
			document.addEventListener('mousedown', closeHandler);
		}, 100);
	};

	const finishLengthEditing = () => {
		state.editingLength = false;
		if (state.lengthEditOverlay) {
			document.body.removeChild(state.lengthEditOverlay);
			state.lengthEditOverlay = null;
		}
	};

	// =============================================
	// УДАЛЕНИЕ
	// =============================================

	const deleteAtPosition = (pos) => {
		const objectToDelete = findObjectAtPoint(pos);
		if (objectToDelete) {
			state.objects = state.objects.filter(obj => obj !== objectToDelete);

			// Удаляем точки пересечения, связанные с этим объектом
			state.intersectionPoints = state.intersectionPoints.filter(point => {
				const hasObjectIntersection = point.intersections.some(
					intersection => intersection.type === 'line-object' &&
						intersection.objectId === objectToDelete.getId()
				);
				return !hasObjectIntersection;
			});

			// Пересчитываем пересечения линий
			splitAllIntersectingLines();
			updateLineTrackProperties();

			hidePropertiesPanel();
			state.needsRedraw = true;
			updateStats();
			redraw();
			return;
		}

		const lineToDelete = findLineAtPoint(pos);
		if (lineToDelete) {
			state.lines = state.lines.filter(line => line !== lineToDelete);

			// Удаляем точки пересечения, связанные с этой линией
			state.intersectionPoints = state.intersectionPoints.filter(point => {
				const hasLineIntersection = point.intersections.some(
					intersection => (intersection.type === 'line-line' &&
						(intersection.line1Id === lineToDelete.id ||
							intersection.line2Id === lineToDelete.id)) ||
						(intersection.type === 'line-object' &&
							intersection.lineId === lineToDelete.id)
				);
				return !hasLineIntersection;
			});

			hideLinePropertiesPanel();
			state.needsRedraw = true;
			updateStats();
			redraw();
		}
	};

	// =============================================
	// РАБОТА С ТОЧКАМИ ПЕРЕСЕЧЕНИЯ
	// =============================================

	const findIntersectionPointAtPosition = (pos, tolerance = 10) => {
		for (let point of state.intersectionPoints) {
			if (Geometry.distance(point, pos) < tolerance) {
				return point;
			}
		}
		return null;
	};

	// =============================================
	// ОТРИСОВКА
	// =============================================

	const drawGrid = (ctx, width, height, gridSize) => {
		ctx.save();
		ctx.strokeStyle = '#e0e0e0';
		ctx.lineWidth = 0.5;

		for (let x = 0; x <= width; x += gridSize) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}

		for (let y = 0; y <= height; y += gridSize) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}

		ctx.restore();
	};

	const drawLine = (ctx, line) => {
		ctx.save();

		const dx = line.end.x - line.start.x;
		const dy = line.end.y - line.start.y;
		const length = Math.hypot(dx, dy);

		if (length === 0) {
			ctx.restore();
			return;
		}

		const angle = Math.atan2(dy, dx);
		const lineWidth = line.width || 5;

		ctx.translate(line.start.x, line.start.y);
		ctx.rotate(angle);

		ctx.fillStyle = line.color;
		ctx.fillRect(0, -lineWidth / 2, length, lineWidth);

		ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
		ctx.lineWidth = 1;
		ctx.strokeRect(0, -lineWidth / 2, length, lineWidth);

		ctx.restore();
	};

	const drawLengthInfo = (ctx, line) => {
		const midPoint = {
			x: (line.start.x + line.end.x) / 2,
			y: (line.start.y + line.end.y) / 2
		};

		ctx.save();
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const length = Geometry.distance(line.start, line.end);
		const lengthText = line.customLength !== undefined ?
			`${line.customLength}m` :
			`${length.toFixed(1)}m`;

		ctx.fillStyle = line.customLength !== undefined ? 'red' : 'black';
		ctx.font = line.customLength !== undefined ? 'bold 12px Arial' : '12px Arial';
		ctx.fillText(lengthText, midPoint.x, midPoint.y - 15);
		ctx.restore();
	};

	const drawLineProperties = (ctx, line) => {
		const midPoint = {
			x: (line.start.x + line.end.x) / 2,
			y: (line.start.y + line.end.y) / 2
		};

		ctx.save();
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = 'blue';
		ctx.font = '10px Arial';

		const properties = [];
		if (line.cheight) properties.push(`H:${line.cheight}`);
		if (line.cwidth) properties.push(`W:${line.cwidth}`);
		if (line.cvolume) properties.push(`V:${line.cvolume}`);

		if (properties.length > 0) {
			ctx.fillText(properties.join(' '), midPoint.x, midPoint.y + 15);
		}

		ctx.restore();
	};

	const drawStartEndpointMarker = (ctx, point) => {
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
	};

	const drawEndEndpointMarker = (ctx, point) => {
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
	};

	const drawIntersectionPoint = (ctx, point, isSelected = false) => {
		ctx.save();

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

		ctx.fillStyle = 'white';
		ctx.font = 'bold 18px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';

		let label = `${point.id}`;
		if (point.intersections.length >= 1) {
			label += ` (${point.intersections.length})`;
		}

		ctx.fillText(label, point.x, point.y - (isSelected ? 12 : 8));
		ctx.restore();
	};

	const redraw = () => {
		const ctx = state.ctx;
		const bufferCtx = state.bufferCtx;

		if (state.bufferCanvas.width !== state.canvas.width ||
			state.bufferCanvas.height !== state.canvas.height) {
			state.bufferCanvas.width = state.canvas.width;
			state.bufferCanvas.height = state.canvas.height;
			state.needsRedraw = true;
		}

		if (state.needsRedraw) {
			bufferCtx.clearRect(0, 0, state.bufferCanvas.width, state.bufferCanvas.height);

			// Сетка
			if (state.snapToGrid) {
				drawGrid(bufferCtx, state.canvas.width, state.canvas.height, state.gridSize);
			}

			// Линии
			state.lines.forEach(line => {
				drawLine(bufferCtx, line);
				drawLengthInfo(bufferCtx, line);
				drawLineProperties(bufferCtx, line);
			});

			// Маркеры концов линий
			if (state.showEndpoints) {
				drawAllLineEndpoints(bufferCtx);
			}

			// Объекты
			state.objects.forEach(obj => obj.draw(bufferCtx));

			// Точки пересечения
			if (state.showIntersections && state.intersectionPoints.length > 0) {
				drawIntersectionPoints(bufferCtx);
			}

			state.needsRedraw = false;
		}

		// Очищаем основной холст и рисуем буфер
		ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
		ctx.drawImage(state.bufferCanvas, 0, 0);

		// Дополнительные свойства
		if (state.showTrackProperties) {
			drawTrackProperties(ctx);
			drawPassabilityProperties(ctx);
		}

		// Временная линия
		if (state.tempLine) {
			drawTemporaryLine();
		} else if (state.selectedElement) {
			highlightElement(state.selectedElement, ctx);
		}

		// Маркеры выбранной линии
		if (state.selectedElement && state.selectedElement.start && state.selectedElement.end) {
			drawSelectedLineEndpoints(ctx);
		}
	};

	const drawTemporaryLine = () => {
		state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
		state.ctx.drawImage(state.bufferCanvas, 0, 0);

		if (state.tempLine) {
			state.ctx.save();

			const dx = state.tempLine.end.x - state.tempLine.start.x;
			const dy = state.tempLine.end.y - state.tempLine.start.y;
			const length = Math.hypot(dx, dy);

			if (length > 0) {
				const angle = Math.atan2(dy, dx);
				const lineWidth = state.tempLine.width || 5;

				state.ctx.translate(state.tempLine.start.x, state.tempLine.start.y);
				state.ctx.rotate(angle);

				state.ctx.fillStyle = 'rgba(128, 128, 128, 0.2)';
				state.ctx.fillRect(0, -lineWidth / 2, length, lineWidth);

				state.ctx.strokeStyle = 'red';
				state.ctx.lineWidth = 1;
				state.ctx.strokeRect(0, -lineWidth / 2, length, lineWidth);
			}

			state.ctx.restore();

			drawStartEndpointMarker(state.ctx, state.tempLine.start);
			drawEndEndpointMarker(state.ctx, state.tempLine.end);

			const midPoint = {
				x: (state.tempLine.start.x + state.tempLine.end.x) / 2,
				y: (state.tempLine.start.y + state.tempLine.end.y) / 2
			};
			const realLength = Geometry.distance(state.tempLine.start, state.tempLine.end);

			state.ctx.save();
			state.ctx.textAlign = 'center';
			state.ctx.textBaseline = 'middle';
			state.ctx.fillStyle = 'red';
			state.ctx.font = 'bold 12px Arial';
			state.ctx.fillText(`${realLength.toFixed(1)}m`, midPoint.x, midPoint.y - 15);
			state.ctx.restore();
		}

		if (state.selectedElement) {
			highlightElement(state.selectedElement, state.ctx);
		}
	};

	const drawAllLineEndpoints = (ctx = state.ctx) => {
		if (!state.showEndpoints) return;

		state.lines.forEach(line => {
			drawStartEndpointMarker(ctx, line.start);
			drawEndEndpointMarker(ctx, line.end);
		});
	};

	const drawIntersectionPoints = (ctx = state.ctx) => {
		state.intersectionPoints.forEach(point => {
			const isSelected = state.selectedElement && state.selectedElement.id === point.id;
			drawIntersectionPoint(ctx, point, isSelected);
		});
	};

	const drawSelectedLineEndpoints = (ctx) => {
		if (!state.selectedElement || !state.selectedElement.start || !state.selectedElement.end) return;

		ctx.save();

		// Начало линии
		ctx.fillStyle = '#00ff00';
		ctx.beginPath();
		ctx.arc(state.selectedElement.start.x, state.selectedElement.start.y, 8, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 12px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('С', state.selectedElement.start.x, state.selectedElement.start.y);

		// Конец линии
		ctx.fillStyle = '#ff0000';
		ctx.beginPath();
		ctx.arc(state.selectedElement.end.x, state.selectedElement.end.y, 8, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 12px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('К', state.selectedElement.end.x, state.selectedElement.end.y);

		ctx.restore();
	};

	const highlightElement = (element, ctx = state.ctx) => {
		ctx.save();
		ctx.strokeStyle = '#ff0000';
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 5]);

		if (element.start && element.end) {
			const bounds = getLineBounds(element);
			ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

			ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
			ctx.beginPath();
			ctx.arc(element.start.x, element.start.y, 10, 0, 2 * Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(element.end.x, element.end.y, 10, 0, 2 * Math.PI);
			ctx.fill();
		} else if (element.x !== undefined && element.y !== undefined) {
			const elementState = element.getState ? element.getState() : element;
			ctx.strokeRect(
				elementState.x - 5, elementState.y - 5,
				(elementState.width || 0) + 10,
				(elementState.height || 0) + 10
			);
		}

		ctx.restore();
	};

	const getLineBounds = (line) => {
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
	};

	const drawTrackProperties = (ctx = state.ctx) => {
		if (!state.showTrackProperties) return;

		state.lines.forEach(line => {
			if (line.track && line.track.length > 0) {
				line.track.forEach(trackId => {
					const point = state.intersectionPoints.find(p => p.id === trackId);
					if (point) drawTrackMarker(ctx, point, 'T', 'rgba(0, 255, 0, 0.7)');
				});
			}

			if (line.endtrack && line.endtrack.length > 0) {
				line.endtrack.forEach(endtrackId => {
					const point = state.intersectionPoints.find(p => p.id === endtrackId);
					if (point) drawTrackMarker(ctx, point, 'E', 'rgba(255, 0, 0, 0.7)');
				});
			}
		});
	};

	const drawTrackMarker = (ctx, point, text, color) => {
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
	};

	const drawPassabilityProperties = (ctx = state.ctx) => {
		if (!state.showTrackProperties) return;

		state.lines.forEach(line => {
			if (line.passability) {
				Object.entries(line.passability).forEach(([pointId, value]) => {
					if (pointId === 'default') return;

					const point = state.intersectionPoints.find(p => p.id == pointId);
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
	};

	// =============================================
	// UI УПРАВЛЕНИЕ
	// =============================================

	const setupUI = () => {
		setupModeButtons();
		setupColorButtons();
		setupCheckboxes();
		setupActionButtons();
		setupPropertyButtons();
		setupTrackPropertyButtons();
	};

	const setupModeButtons = () => {
		document.querySelectorAll('.mode-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				setMode(e.target.dataset.mode);
				state.currentObjectType = null;
				document.querySelectorAll('.object-item').forEach(item => {
					item.classList.remove('selected');
				});
				hidePropertiesPanel();
				hideLinePropertiesPanel();
			});
		});
	};

	const setMode = (mode) => {
		state.mode = mode;

		document.querySelectorAll('.mode-btn').forEach(btn => {
			btn.classList.remove('active');
		});

		const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
		if (activeBtn) activeBtn.classList.add('active');

		const currentMode = document.getElementById('currentMode');
		if (currentMode) {
			const modeTexts = {
				'draw': state.currentObjectType ? 'Добавление объектов' : 'Рисование линий',
				'move': 'Перемещение',
				'edit': 'Редактирование',
				'delete': 'Удаление'
			};
			currentMode.textContent = modeTexts[mode] || mode;
		}

		state.canvas.style.cursor = getCursorForMode(mode);
	};

	const getCursorForMode = (mode) => {
		const cursors = {
			'draw': 'crosshair',
			'move': 'move',
			'edit': 'pointer',
			'delete': 'not-allowed'
		};
		return cursors[mode] || 'default';
	};

	const setupColorButtons = () => {
		document.querySelectorAll('.color-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				setColor(e.target.dataset.color);
			});
		});
	};

	const setColor = (color) => {
		state.lineColor = color;
		document.querySelectorAll('.color-btn').forEach(btn => {
			btn.classList.remove('active');
		});

		const colorBtn = document.querySelector(`[data-color="${color}"]`);
		if (colorBtn) colorBtn.classList.add('active');

		const currentColor = document.getElementById('currentColor');
		if (currentColor) currentColor.textContent = color;
	};

	const setupCheckboxes = () => {
		const snapToGrid = document.getElementById('snapToGrid');
		if (snapToGrid) {
			snapToGrid.addEventListener('change', (e) => {
				state.snapToGrid = e.target.checked;
				state.needsRedraw = true;
				redraw();
			});
		}

		const snapToPoints = document.getElementById('snapToPoints');
		if (snapToPoints) {
			snapToPoints.addEventListener('change', (e) => {
				state.snapToPoints = e.target.checked;
			});
		}
	};

	const setupActionButtons = () => {
		const actions = {
			'clearAll': () => clearAll(),
			'showAllLines': () => logAllLines(),
			'findIntersections': () => findIntersections(),
			'savePDF': () => saveAsPDF(),
			'clearIntersections': () => clearIntersections(),
			'toggleIntersections': () => toggleIntersections(),
			'showLineTrackInfo': () => showLineTrackInfoHandler(),
			'updateAllTrackProperties': () => updateLineTrackProperties(),
			'exportAllLinesData': () => exportAllLinesData(),
			'updatePassability': () => updatePassabilityForAllLines(),
			'showPassabilityInfo': () => showPassabilityInfoHandler(),
			'exportIntersections': () => exportIntersectionData(),
			'toggleEndpoints': () => toggleEndpoints(),
			'addTestObject': () => addTestObject()
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
				state.lineWidth = parseInt(e.target.value) || 5;
				state.needsRedraw = true;
				redraw();
			});
		}
	};

	const setupPropertyButtons = () => {
		// Кнопка "Применить" для свойств объекта
		const applyPropertiesBtn = document.getElementById('applyProperties');
		if (applyPropertiesBtn) {
			applyPropertiesBtn.addEventListener('click', () => applyObjectProperties());
		}

		// Кнопка "Отмена" для свойств объекта
		const cancelPropertiesBtn = document.getElementById('cancelProperties');
		if (cancelPropertiesBtn) {
			cancelPropertiesBtn.addEventListener('click', () => hidePropertiesPanel());
		}

		// Кнопка "Повернуть" для объекта
		const rotateButton = document.getElementById('rotateButton');
		if (rotateButton) {
			rotateButton.addEventListener('click', () => rotateSelectedObject());
		}

		// Кнопка "Применить" для свойств линии
		const applyLinePropertiesBtn = document.getElementById('applyLineProperties');
		if (applyLinePropertiesBtn) {
			applyLinePropertiesBtn.addEventListener('click', () => applyLineProperties());
		}

		// Кнопка "Отмена" для свойств линии
		const cancelLinePropertiesBtn = document.getElementById('cancelLineProperties');
		if (cancelLinePropertiesBtn) {
			cancelLinePropertiesBtn.addEventListener('click', () => hideLinePropertiesPanel());
		}

		// Кнопка "Показать все свойства линий"
		const showLinePropertiesBtn = document.getElementById('showLineProperties');
		if (showLinePropertiesBtn) {
			showLinePropertiesBtn.addEventListener('click', () => showAllLinesProperties());
		}
	};

	const setupTrackPropertyButtons = () => {
		const toggleTrackProperties = document.getElementById('toggleTrackProperties');
		if (toggleTrackProperties) {
			toggleTrackProperties.addEventListener('click', () => {
				if (state.selectedElement) {
					if (state.selectedElement.start && state.selectedElement.end) {
						showLineTrackInfo(state.selectedElement);
					}
					else if (state.selectedElement.intersections) {
						showIntersectionInfo(state.selectedElement);
					}
					else if (state.selectedElement.getState) {
						const objState = state.selectedElement.getState();
						const objInfo = `Объект: ${objState.label}\n` +
							`Тип: ${objState.type}\n` +
							`Координаты: (${state.selectedElement.getCenter().x.toFixed(1)}, ${state.selectedElement.getCenter().y.toFixed(1)})\n` +
							`Размеры: ${objState.width} x ${objState.height}\n` +
							`Поворот: ${objState.rotation}°`;
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
				state.showTrackProperties = !state.showTrackProperties;
				state.needsRedraw = true;
				redraw();
			});
		}
	};

	const setupObjectLibrary = () => {
		const categories = document.querySelectorAll('.category-btn');
		categories.forEach(btn => {
			btn.addEventListener('click', (e) => {
				categories.forEach(b => b.classList.remove('active'));
				e.target.classList.add('active');
				showCategory(e.target.dataset.category);
			});
		});
		populateObjectLibrary();
	};

	const populateObjectLibrary = () => {
		const objectsGrid = document.getElementById('objectsGrid');
		if (!objectsGrid) return;

		objectsGrid.innerHTML = '';
		const objectFactory = createObjectFactory();
		const objectTypes = objectFactory.getObjectTypes();

		objectTypes.forEach(objInfo => {
			const objElement = document.createElement('div');
			objElement.className = 'object-item';
			objElement.dataset.type = objInfo.type;
			objElement.dataset.category = objInfo.category;

			objElement.innerHTML = `
                <div class="object-icon">
                    <img src="${objInfo.icon}" alt="..." title="${objInfo.name}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\"><rect width=\"40\" height=\"40\" fill=\"%23ccc\</svg>'"/>
                </div>
                <div class="object-name">${objInfo.name}</div>
            `;

			objElement.addEventListener('click', () => {
				document.querySelectorAll('.object-item').forEach(item => {
					item.classList.remove('selected');
				});
				objElement.classList.add('selected');
				state.currentObjectType = objInfo.type;
				setMode('draw');
			});

			objectsGrid.appendChild(objElement);
		});
	};

	const showCategory = (category) => {
		const objects = document.querySelectorAll('.object-item');
		objects.forEach(obj => {
			obj.style.display = (category === 'all' || obj.dataset.category === category)
				? 'flex'
				: 'none';
		});
	};

	// =============================================
	// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ РЕДАКТОРА
	// =============================================

	const addTestObject = () => {
		const x = Math.random() * (state.canvas.width - 100) + 50;
		const y = Math.random() * (state.canvas.height - 100) + 50;
		const objectFactory = createObjectFactory();
		const types = Object.keys(objectFactory.getObjectTypes());
		const randomType = types[Math.floor(Math.random() * types.length)];

		addObject(randomType, x, y);
	};

	const findIntersections = () => {
		const intersectionManager = createIntersectionManager();
		const allIntersectionPoints = [];

		// Пересечения линий с линиями
		for (let i = 0; i < state.lines.length; i++) {
			for (let j = i + 1; j < state.lines.length; j++) {
				const intersection = Geometry.getLineIntersection(
					state.lines[i].start, state.lines[i].end,
					state.lines[j].start, state.lines[j].end
				);

				if (intersection) {
					const isOnLine1 = Geometry.isPointOnLineSegment(
						intersection, state.lines[i].start, state.lines[i].end, 3
					);
					const isOnLine2 = Geometry.isPointOnLineSegment(
						intersection, state.lines[j].start, state.lines[j].end, 3
					);

					if (isOnLine1 && isOnLine2) {
						const intersectionPoint = intersectionManager.createPoint(intersection.x, intersection.y);

						const line1Endpoint = getLineEndpointAtIntersection(
							state.lines[i], intersection, intersectionPoint.id, 5
						);
						const line2Endpoint = getLineEndpointAtIntersection(
							state.lines[j], intersection, intersectionPoint.id, 5
						);

						intersectionPoint.intersections.push({
							type: 'line-line',
							line1: state.lines[i],
							line2: state.lines[j],
							line1Endpoint,
							line2Endpoint,
							line1Id: state.lines[i].id,
							line2Id: state.lines[j].id
						});

						allIntersectionPoints.push(intersectionPoint);
					}
				}
			}
		}

		// Пересечения линий с объектами
		for (const line of state.lines) {
			for (const obj of state.objects) {
				const intersection = getLineObjectIntersection(line, obj);
				if (intersection) {
					const isOnLine = Geometry.isPointOnLineSegment(
						intersection.point, line.start, line.end, 3
					);

					if (isOnLine) {
						let existingPoint = null;
						for (const point of allIntersectionPoints) {
							if (point.isNear(intersection.point, 5)) {
								existingPoint = point;
								break;
							}
						}

						if (!existingPoint) {
							existingPoint = intersectionManager.createPoint(intersection.point.x, intersection.point.y);
							allIntersectionPoints.push(existingPoint);
						}

						const lineEndpoint = getLineEndpointAtIntersection(
							line, intersection.point, existingPoint.id, 5
						);

						existingPoint.intersections.push({
							type: 'line-object',
							line: line,
							object: obj,
							lineEndpoint: lineEndpoint,
							objectSide: intersection.side,
							lineId: line.id,
							objectId: obj.getId()
						});
					}
				}
			}
		}

		state.intersectionPoints = mergeCloseIntersectionPoints(allIntersectionPoints);
		state.intersectionInfo = state.intersectionPoints.map(point => point.getInfo());
		updateLineTrackProperties();
		state.showIntersections = true;
		state.needsRedraw = true;
		redraw();

		return state.intersectionPoints;
	};

	const mergeCloseIntersectionPoints = (allPoints) => {
		const mergedPoints = [];
		const usedPoints = new Set();
		const sortedPoints = [...allPoints].sort((a, b) => a.x - b.x);

		for (let i = 0; i < sortedPoints.length; i++) {
			const point = sortedPoints[i];
			if (usedPoints.has(point.id)) continue;

			const intersectionManager = createIntersectionManager();
			const mergedPoint = intersectionManager.createPoint(point.x, point.y);
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
	};

	const showIntersectionInfo = (point) => {
		let message = `Точка пересечения #${point.id}\n`;
		message += `Координаты: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})\n`;
		message += `Количество пересечений в точке: ${point.intersections.length}\n\n`;

		if (point.intersections.length > 0) {
			message += "Детали пересечений:\n";
			point.intersections.forEach((intersection, index) => {
				message += `\nПересечение ${index + 1}:\n`;

				if (intersection.type === 'line-line') {
					message += `  Тип: Линия с линией\n`;
					message += `  Линия 1 (ID: ${intersection.line1Id || 'нет'}): `;
					message += `(${intersection.line1.start.x.toFixed(1)},${intersection.line1.start.y.toFixed(1)}) - `;
					message += `(${intersection.line1.end.x.toFixed(1)},${intersection.line1.end.y.toFixed(1)})\n`;
					message += formatEndpointInfo(intersection.line1Endpoint, 1);

					message += `  Линия 2 (ID: ${intersection.line2Id || 'нет'}): `;
					message += `(${intersection.line2.start.x.toFixed(1)},${intersection.line2.start.y.toFixed(1)}) - `;
					message += `(${intersection.line2.end.x.toFixed(1)},${intersection.line2.end.y.toFixed(1)})\n`;
					message += formatEndpointInfo(intersection.line2Endpoint, 2);
				} else if (intersection.type === 'line-object') {
					message += `  Тип: Линия с объектом\n`;
					message += `  Линия (ID: ${intersection.lineId || 'нет'}): `;
					message += `(${intersection.line.start.x.toFixed(1)},${intersection.line.start.y.toFixed(1)}) - `;
					message += `(${intersection.line.end.x.toFixed(1)},${intersection.line.end.y.toFixed(1)})\n`;
					message += formatEndpointInfo(intersection.lineEndpoint, 1);

					message += `  Объект: ${intersection.object.getState().label}\n`;
					message += `  Тип объекта: ${intersection.object.getState().type}\n`;
					message += `  Сторона объекта: ${intersection.objectSide}\n`;
				}
			});
		} else {
			message += "Нет деталей о пересечениях";
		}

		showInfoModal(message, point);
	};

	const formatEndpointInfo = (endpoint, lineNumber) => {
		switch (endpoint) {
			case 'start': return `    Линия ${lineNumber} подходит НАЧАЛОМ к точке\n`;
			case 'end': return `    Линия ${lineNumber} подходит КОНЦОМ к точке\n`;
			case 'middle': return `    Точка в СЕРЕДИНЕ линии ${lineNumber}\n`;
			default: return `    Неизвестно каким концом (линия ${lineNumber})\n`;
		}
	};

	const showInfoModal = (message, point) => {
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

		state.selectedElement = point;
		state.needsRedraw = true;
		redraw();
	};

	const showAllLinesProperties = () => {
		const linesProperties = getAllLinesProperties();
		let message = `Всего линий: ${linesProperties.length}\n\n`;

		linesProperties.forEach((line, index) => {
			message += `Линия ${index + 1}:\n`;
			message += `  Длина: ${line.realLength.toFixed(1)}m\n`;
			message += `  Высота: ${line.cheight || 'не задана'}\n`;
			message += `  Ширина: ${line.cwidth || 'не задана'}\n`;
			message += `  Объем: ${line.cvolume || 'не задана'}\n`;
			message += `  Track свойств: ${line.track ? line.track.length : 0}\n`;
			message += `  Endtrack свойств: ${line.endtrack ? line.endtrack.length : 0}\n`;
			message += `  Passability: ${line.passability ? JSON.stringify(line.passability) : 'нет'}\n\n`;
		});

		alert(message);
	};

	const getAllLinesProperties = () => {
		return state.lines.map(line => getLineProperties(line));
	};

	const getLineProperties = (line) => {
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
			realLength: Geometry.distance(line.start, line.end),
			track: line.track || [],
			endtrack: line.endtrack || [],
			passability: line.passability || {}
		};
	};

	const showLineTrackInfoHandler = () => {
		if (state.selectedElement && state.selectedElement.start && state.selectedElement.end) {
			showLineTrackInfo(state.selectedElement);
		} else {
			alert('Выберите линию для просмотра свойств');
		}
	};

	const showLineTrackInfo = (line) => {
		let message = `Свойства линии (ID: ${line.id}):\n`;
		message += `Начало: (${line.start.x.toFixed(1)}, ${line.start.y.toFixed(1)})\n`;
		message += `Конец: (${line.end.x.toFixed(1)}, ${line.end.y.toFixed(1)})\n`;
		message += `Длина: ${Geometry.distance(line.start, line.end).toFixed(1)}px\n\n`;

		message += `Свойство track (начало в точках пересечения):\n`;
		if (line.track && line.track.length > 0) {
			line.track.forEach(trackId => {
				const point = state.intersectionPoints.find(p => p.id === trackId);
				if (point) {
					message += `  • Точка #${trackId} (${point.x.toFixed(1)}, ${point.y.toFixed(1)})\n`;
				}
			});
		} else {
			message += `  нет\n`;
		}

		message += `\nСвойство endtrack (конец в точках пересечения):\n`;
		if (line.endtrack && line.endtrack.length > 0) {
			line.endtrack.forEach(endtrackId => {
				const point = state.intersectionPoints.find(p => p.id === endtrackId);
				if (point) {
					message += `  • Точка #${endtrackId} (${point.x.toFixed(1)}, ${point.y.toFixed(1)})\n`;
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
					const point = state.intersectionPoints.find(p => p.id == pointId);
					if (point) {
						let endpointInfo = '';
						if (value === 5) endpointInfo = '(начало линии)';
						else if (value === 10) endpointInfo = '(конец линии)';
						message += `  • Точка #${pointId}: ${value} ${endpointInfo}\n`;
					}
				}
			});
		} else {
			message += `  нет\n`;
		}

		console.log(message);
		alert(message);
	};

	const showPassabilityInfoHandler = () => {
		if (state.selectedElement && state.selectedElement.start && state.selectedElement.end) {
			showLinePassabilityInfo(state.selectedElement);
		} else {
			alert('Выберите линию для просмотра свойств passability');
		}
	};

	const showLinePassabilityInfo = (line) => {
		let message = `Свойства passability для линии (ID: ${line.id}):\n`;
		message += `Начало: (${line.start.x.toFixed(1)}, ${line.start.y.toFixed(1)})\n`;
		message += `Конец: (${line.end.x.toFixed(1)}, ${line.end.y.toFixed(1)})\n\n`;

		if (line.passability && Object.keys(line.passability).length > 0) {
			message += `Значения passability:\n`;

			Object.entries(line.passability).forEach(([pointId, value]) => {
				if (pointId === 'default') {
					message += `  • По умолчанию: ${value}\n`;
				} else {
					const point = state.intersectionPoints.find(p => p.id == pointId);
					if (point) {
						let endpointInfo = '';
						if (value === 5) endpointInfo = '(подходит началом)';
						else if (value === 10) endpointInfo = '(подходит концом)';
						message += `  • Точка #${pointId} (${point.x.toFixed(1)}, ${point.y.toFixed(1)}): ${value} ${endpointInfo}\n`;
					}
				}
			});
		} else {
			message += `Нет данных о passability`;
		}

		console.log(message);
		alert(message);
	};

	const updatePassabilityForAllLines = () => {
		state.lines.forEach(line => {
			if (!line.passability) line.passability = {};
			line.passability = {};

			state.intersectionPoints.forEach(point => {
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
	};

	// =============================================
	// УТИЛИТЫ РЕДАКТОРА
	// =============================================

	const clearAll = () => {
		if (confirm('Вы уверены, что хотите очистить всё?')) {
			state.lines = [];
			state.objects = [];
			state.intersectionPoints = [];
			state.intersectionInfo = [];
			const intersectionManager = createIntersectionManager();
			intersectionManager.resetCounter();
			hidePropertiesPanel();
			hideLinePropertiesPanel();
			state.needsRedraw = true;
			updateStats();
			redraw();
		}
	};

	const logAllLines = () => {
		console.log('Линии:', state.lines);
		console.log('Объекты:', state.objects);
		console.log('Точки пересечения:', state.intersectionPoints);
		alert(`Линий: ${state.lines.length}, Объектов: ${state.objects.length}, Точек пересечения: ${state.intersectionPoints.length}`);
	};

	const clearIntersections = () => {
		state.intersectionPoints = [];
		state.intersectionInfo = [];
		const intersectionManager = createIntersectionManager();
		intersectionManager.resetCounter();
		state.showIntersections = false;
		state.needsRedraw = true;
		updateStats();
		redraw();
		console.log('Точки пересечения очищены');
	};

	const toggleIntersections = () => {
		state.showIntersections = !state.showIntersections;
		const toggleButton = document.getElementById('toggleIntersections');
		if (toggleButton) {
			toggleButton.textContent = state.showIntersections ?
				'Скрыть пересечения' : 'Показать пересечения';
		}
		state.needsRedraw = true;
		redraw();
		console.log(`Отображение пересечений: ${state.showIntersections ? 'включено' : 'выключено'}`);
	};

	const toggleEndpoints = () => {
		state.showEndpoints = !state.showEndpoints;
		const toggleButton = document.getElementById('toggleEndpoints');
		if (toggleButton) {
			toggleButton.textContent = state.showEndpoints ?
				'Скрыть маркеры концов' : 'Показать маркеры концов';
		}
		state.needsRedraw = true;
		redraw();
		console.log(`Отображение маркеров концов: ${state.showEndpoints ? 'включено' : 'выключено'}`);
	};

	const saveAsPDF = () => {
		if (typeof window.jspdf === 'undefined') {
			alert('Библиотека jsPDF не загружена. Пожалуйста, проверьте подключение к интернету.');
			return;
		}

		const { jsPDF } = window.jspdf;
		const pdf = new jsPDF();
		const canvas = state.canvas;
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
		pdf.text(`Всего линий: ${state.lines.length}`, 10, 20);
		pdf.text(`Всего объектов: ${state.objects.length}`, 10, 30);

		if (state.intersectionPoints.length > 0) {
			pdf.text(`Точек пересечения: ${state.intersectionPoints.length}`, 10, 40);
		}

		pdf.save('чертеж.pdf');
	};

	const updateStats = () => {
		const elements = {
			'objectsCount': state.objects.length,
			'linesCount': state.lines.length,
			'intersectionsCount': state.intersectionPoints.length
		};

		Object.entries(elements).forEach(([id, count]) => {
			const element = document.getElementById(id);
			if (element) element.textContent = count;
		});
	};

	const exportAllLinesData = () => {
		const data = state.lines.map(line => getLineProperties(line));
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
	};

	const exportIntersectionData = () => {
		const data = state.intersectionPoints.map(point => {
			const info = point.getInfo();
			info.intersectionTypes = {
				lineLine: point.intersections.filter(i => i.type === 'line-line').length,
				lineObject: point.intersections.filter(i => i.type === 'line-object').length
			};
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
	};

	// Публичные методы
	return {
		init,
		redraw,
		setMode,
		setColor,
		clearAll,
		findIntersections,
		saveAsPDF,
		clearIntersections,
		toggleIntersections,
		toggleEndpoints,
		updateStats,
		getState: () => ({ ...state }),
		addObject,
		addTestObject,
		updateLineTrackProperties,
		exportAllLinesData,
		exportIntersectionData,
		updatePassabilityForAllLines,
		showAllLinesProperties,
		showLineTrackInfo: showLineTrackInfoHandler,
		// Экспортируем функции для работы с панелями свойств
		applyLineProperties,
		hideLinePropertiesPanel,
		showLinePropertiesPanel,
		applyObjectProperties,
		hidePropertiesPanel,
		showPropertiesPanel,
		rotateSelectedObject
	};
};

// Инициализация редактора при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
	const editor = createEditorCore('drawingCanvas');
	window.editor = editor;
	editor.init();

	setTimeout(() => editor.redraw(), 100);
});