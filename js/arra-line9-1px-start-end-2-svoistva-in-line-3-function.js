// ==================== УТИЛИТЫ ====================
const Utils = {
	distance: (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y),

	isPointInsideRect: (point, rect) =>
		point.x >= rect.x &&
		point.x <= rect.x + rect.width &&
		point.y >= rect.y &&
		point.y <= rect.y + rect.height,

	lineIntersection: (p1, p2, p3, p4) => {
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

		return Utils.distance(point, { x: xx, y: yy }) < tolerance;
	},

	calculateLineLength: (line) => Utils.distance(line.start, line.end),

	snapToGrid: (x, y, gridSize) => ({
		x: Math.round(x / gridSize) * gridSize,
		y: Math.round(y / gridSize) * gridSize
	})
};

// ==================== ФАБРИКИ ОБЪЕКТОВ ====================
const ObjectFactory = (() => {
	const objectConfigs = {
		'door': { width: 30, height: 30, image: './img/dvercloses.png', label: 'Дверь закрытая', category: 'doors_windows' },
		'door2': { width: 30, height: 30, image: './img/dverwentoknowood.png', label: 'Дверь деревянная с вентоткном', category: 'doors_windows' },
		'door3': { width: 40, height: 30, image: './img/dverventrech.png', label: 'Дверь с вентрешеткой', category: 'doors_windows' },
		'door4': { width: 30, height: 30, image: './img/dveropenmetall.png', label: 'Дверь металлическая открытая', category: 'doors_windows' },
		'fan': { width: 40, height: 40, image: './img/fan.png', label: 'Вентилятор основной', category: 'fan' },
		'fan2': { width: 40, height: 40, image: './img/fan2.png', label: 'Вентилятор', category: 'fan' },
		'fire': { width: 40, height: 40, image: './img/fire.png', label: 'Огонь', category: 'fire' },
		'fire2': { width: 40, height: 40, image: './img/pozarniigidrant.png', label: 'Пожарный гидрант', category: 'fire' },
		'boom': { width: 40, height: 40, image: './img/massovievzivniepaboti.png', label: 'Массовые взрывные работы', category: 'boom' },
		'boom2': { width: 40, height: 40, image: './img/vzrivnieraboti.png', label: 'Взрывные работы', category: 'boom' },
		'medical': { width: 40, height: 40, image: './img/medpunkt.png', label: 'Медицинский пункт', category: 'medical' },
		'building': { width: 30, height: 30, image: './img/nadshahtnoe.png', label: 'Надшахтное строение', category: 'building' },
		'pumps': { width: 40, height: 40, image: './img/nanospogruznoi.png', label: 'Насос погружной', category: 'pumps' },
		'pumps2': { width: 40, height: 40, image: './img/nasosnayastancia.png', label: 'Насосная станция', category: 'pumps' },
		'people': { width: 40, height: 40, image: './img/people.png', label: 'Люди', category: 'people' },
		'jumper': { width: 30, height: 30, image: './img/petemichkabeton.png', label: 'Перемычка бетонная', category: 'jumper' },
		'jumper2': { width: 30, height: 30, image: './img/petemichkakirpich.png', label: 'Перемычка кирпичная', category: 'jumper' },
		'jumper3': { width: 30, height: 30, image: './img/petemichkametall.png', label: 'Перемычка металлическая', category: 'jumper' },
		'jumper4': { width: 30, height: 30, image: './img/petemichkawood.png', label: 'Перемычка деревянная', category: 'jumper' },
		'phone': { width: 40, height: 40, image: './img/phone.png', label: 'Телефон', category: 'phone' },
		'equipment': { width: 40, height: 40, image: './img/samohodnoe.png', label: 'Самоходное оборудование', category: 'equipment' },
		'entrance': { width: 40, height: 20, image: './img/zapasvhod.png', label: 'Запасной вход', category: 'entrance' }
	};

	const createCanvasObject = (type, x, y, width, height, color = '#3498db', label = 'Объект') => ({
		id: Date.now() + Math.random(),
		type,
		x,
		y,
		width,
		height,
		color,
		label,
		selected: false,
		rotation: 0,
		image: null,
		imageLoaded: false,
		properties: {}
	});

	const createImageObject = (type, x, y, width, height, imageUrl, label = 'Объект') => {
		const obj = createCanvasObject(type, x, y, width, height, '#3498db', label);
		obj.properties = { imageUrl };
		obj.imageLoading = false;

		if (imageUrl) {
			obj.image = new Image();
			obj.image.onload = () => {
				obj.imageLoaded = true;
			};
			obj.image.onerror = () => {
				obj.imageLoaded = false;
				console.error('Не удалось загрузить изображение');
			};
			obj.image.src = imageUrl;
		}

		return obj;
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

		getObjectConfigs: () => objectConfigs
	};
})();

// ==================== ТОЧКИ ПЕРЕСЕЧЕНИЯ ====================
const IntersectionPoint = (() => {
	let nextId = 1;

	return {
		create: (x, y) => ({
			id: nextId++,
			x,
			y,
			intersections: [],
			formula: 0
		}),

		isNear: (point1, point2, tolerance = 5) => {
			const dx = point1.x - point2.x;
			const dy = point1.y - point2.y;
			return Math.sqrt(dx * dx + dy * dy) < tolerance;
		},

		resetCounter: () => { nextId = 1; }
	};
})();

// ==================== ФУНКЦИИ РИСОВАНИЯ ====================
const DrawingFunctions = {
	drawGrid: (ctx, width, height, gridSize) => {
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
	},

	drawLine: (ctx, line) => {
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
	},

	drawLineLength: (ctx, line) => {
		const midPoint = {
			x: (line.start.x + line.end.x) / 2,
			y: (line.start.y + line.end.y) / 2
		};

		ctx.save();
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const lengthText = line.customLength !== undefined ?
			`${line.customLength}m` :
			`${Utils.calculateLineLength(line).toFixed(1)}m`;

		ctx.fillStyle = line.customLength !== undefined ? 'red' : 'black';
		ctx.font = line.customLength !== undefined ? 'bold 12px Arial' : '12px Arial';
		ctx.fillText(lengthText, midPoint.x, midPoint.y - 15);

		ctx.restore();
	},

	drawLineProperties: (ctx, line) => {
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
	},

	drawStartEndpoint: (ctx, point) => {
		if (!point || typeof point.x === 'undefined') return;

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
	},

	drawEndEndpoint: (ctx, point) => {
		if (!point || typeof point.x === 'undefined') return;

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
	},

	drawAllEndpoints: (ctx, lines) => {
		lines.forEach(line => {
			DrawingFunctions.drawStartEndpoint(ctx, line.start);
			DrawingFunctions.drawEndEndpoint(ctx, line.end);
		});
	},

	drawObject: (ctx, obj) => {
		if (obj.image && obj.imageLoaded) {
			ctx.save();
			const centerX = obj.x + obj.width / 2;
			const centerY = obj.y + obj.height / 2;
			ctx.translate(centerX, centerY);
			ctx.rotate((obj.rotation * Math.PI) / 180);
			ctx.drawImage(obj.image, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
			ctx.restore();
		} else {
			ctx.fillStyle = obj.color;
			ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
			ctx.fillStyle = 'white';
			ctx.font = '10px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(obj.label, obj.x + obj.width / 2, obj.y + obj.height / 2);
		}

		if (obj.selected) {
			ctx.strokeStyle = '#ff0000';
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.strokeRect(obj.x - 5, obj.y - 5, obj.width + 10, obj.height + 10);
			ctx.fillStyle = '#ff0000';
			ctx.font = '10px Arial';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			ctx.fillText(`${obj.rotation}°`, obj.x - 5, obj.y - 15);
			ctx.setLineDash([]);
		}
	},

	drawIntersectionPoints: (ctx, points, selectedPointId) => {
		points.forEach(point => {
			ctx.save();

			const isSelected = selectedPointId === point.id;

			if (isSelected) {
				ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
			} else if (point.intersections.length > 1) {
				ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
			} else {
				ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
			}

			ctx.beginPath();
			ctx.arc(point.x, point.y, isSelected ? 8 : 6, 0, Math.PI * 2);
			ctx.fill();

			if (isSelected) {
				ctx.strokeStyle = 'blue';
				ctx.lineWidth = 2;
				ctx.stroke();
			}

			ctx.fillStyle = 'green';
			ctx.font = 'bold 18px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';

			let label = `${point.id}`;
			if (point.intersections.length >= 1) {
				label += ` (${point.intersections.length})`;
			}

			ctx.fillText(label, point.x, point.y - (isSelected ? 12 : 8));
			ctx.restore();
		});
	},

	drawHighlight: (ctx, element) => {
		ctx.save();
		ctx.strokeStyle = '#ff0000';
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 5]);

		if (element.start && element.end) {
			const minX = Math.min(element.start.x, element.end.x);
			const minY = Math.min(element.start.y, element.end.y);
			const maxX = Math.max(element.start.x, element.end.x);
			const maxY = Math.max(element.start.y, element.end.y);

			ctx.strokeRect(minX - 10, minY - 10, maxX - minX + 20, maxY - minY + 20);

			ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
			ctx.beginPath();
			ctx.arc(element.start.x, element.start.y, 10, 0, 2 * Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(element.end.x, element.end.y, 10, 0, 2 * Math.PI);
			ctx.fill();
		} else if (element.x !== undefined) {
			ctx.strokeRect(
				element.x - 5, element.y - 5,
				(element.width || 0) + 10,
				(element.height || 0) + 10
			);
		}

		ctx.restore();
	},

	drawTrackProperties: (ctx, lines, points) => {
		lines.forEach(line => {
			if (line.track && line.track.length > 0) {
				line.track.forEach(trackId => {
					const point = points.find(p => p.id === trackId);
					if (point) {
						ctx.save();
						ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
						ctx.beginPath();
						ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
						ctx.fill();
						ctx.fillStyle = 'white';
						ctx.font = 'bold 10px Arial';
						ctx.textAlign = 'center';
						ctx.textBaseline = 'middle';
						ctx.fillText('T', point.x, point.y);
						ctx.restore();
					}
				});
			}

			if (line.endtrack && line.endtrack.length > 0) {
				line.endtrack.forEach(endtrackId => {
					const point = points.find(p => p.id === endtrackId);
					if (point) {
						ctx.save();
						ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
						ctx.beginPath();
						ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
						ctx.fill();
						ctx.fillStyle = 'white';
						ctx.font = 'bold 10px Arial';
						ctx.textAlign = 'center';
						ctx.textBaseline = 'middle';
						ctx.fillText('E', point.x, point.y);
						ctx.restore();
					}
				});
			}
		});
	},

	drawPassabilityProperties: (ctx, lines, points) => {
		lines.forEach(line => {
			if (line.passability) {
				Object.entries(line.passability).forEach(([pointId, value]) => {
					if (pointId === 'default') return;

					const point = points.find(p => p.id == pointId);
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
};

// ==================== ФУНКЦИИ ПОИСКА ПЕРЕСЕЧЕНИЙ ====================
const IntersectionFunctions = {
	getLineEndpointAtIntersection: (line, intersectionPoint, intersectionId, tolerance = 5) => {
		const distToStart = Utils.distance(intersectionPoint, line.start);
		const distToEnd = Utils.distance(intersectionPoint, line.end);

		const newLine = { ...line };
		if (!newLine.track) newLine.track = [];
		if (!newLine.endtrack) newLine.endtrack = [];
		if (!newLine.passability) newLine.passability = {};

		let endpoint = 'middle';

		if (distToStart < tolerance && distToEnd < tolerance) {
			endpoint = distToStart < distToEnd ? 'start' : 'end';
			if (endpoint === 'start') {
				if (!newLine.track.includes(intersectionId)) newLine.track.push(intersectionId);
				if (intersectionId) newLine.passability[intersectionId] = 5;
			} else {
				if (!newLine.endtrack.includes(intersectionId)) newLine.endtrack.push(intersectionId);
				if (intersectionId) newLine.passability[intersectionId] = 10;
			}
		} else if (distToStart < tolerance) {
			endpoint = 'start';
			if (!newLine.track.includes(intersectionId)) newLine.track.push(intersectionId);
			if (intersectionId) newLine.passability[intersectionId] = 5;
		} else if (distToEnd < tolerance) {
			endpoint = 'end';
			if (!newLine.endtrack.includes(intersectionId)) newLine.endtrack.push(intersectionId);
			if (intersectionId) newLine.passability[intersectionId] = 10;
		} else {
			if (intersectionId) newLine.passability[intersectionId] = 0;
		}

		return { line: newLine, endpoint };
	},

	mergeCloseIntersectionPoints: (points) => {
		const mergedPoints = [];
		const usedPoints = new Set();
		const sortedPoints = [...points].sort((a, b) => a.x - b.x);

		for (let i = 0; i < sortedPoints.length; i++) {
			const point = sortedPoints[i];
			if (usedPoints.has(point.id)) continue;

			const mergedPoint = { ...point };
			usedPoints.add(point.id);

			for (let j = i + 1; j < sortedPoints.length; j++) {
				const otherPoint = sortedPoints[j];
				if (Math.abs(otherPoint.x - point.x) > 5) break;

				if (!usedPoints.has(otherPoint.id) && IntersectionPoint.isNear(mergedPoint, otherPoint, 5)) {
					mergedPoint.intersections.push(...otherPoint.intersections);
					usedPoints.add(otherPoint.id);
					mergedPoint.x = (mergedPoint.x + otherPoint.x) / 2;
					mergedPoint.y = (mergedPoint.y + otherPoint.y) / 2;
				}
			}

			mergedPoints.push(mergedPoint);
		}

		return mergedPoints;
	},

	findIntersections: (lines) => {
		const allIntersectionPoints = [];
		const updatedLines = [...lines];

		for (let i = 0; i < updatedLines.length; i++) {
			for (let j = i + 1; j < updatedLines.length; j++) {
				const intersection = Utils.lineIntersection(
					updatedLines[i].start, updatedLines[i].end,
					updatedLines[j].start, updatedLines[j].end
				);

				if (intersection) {
					const isOnLine1 = Utils.isPointOnLineSegment(intersection, updatedLines[i].start, updatedLines[i].end, 3);
					const isOnLine2 = Utils.isPointOnLineSegment(intersection, updatedLines[j].start, updatedLines[j].end, 3);

					if (isOnLine1 && isOnLine2) {
						const intersectionPoint = IntersectionPoint.create(intersection.x, intersection.y);

						const result1 = IntersectionFunctions.getLineEndpointAtIntersection(updatedLines[i], intersection, intersectionPoint.id, 5);
						const result2 = IntersectionFunctions.getLineEndpointAtIntersection(updatedLines[j], intersection, intersectionPoint.id, 5);

						updatedLines[i] = result1.line;
						updatedLines[j] = result2.line;

						intersectionPoint.intersections.push({
							type: 'line-line',
							line1: updatedLines[i],
							line2: updatedLines[j],
							line1Endpoint: result1.endpoint,
							line2Endpoint: result2.endpoint,
							line1Id: updatedLines[i].id,
							line2Id: updatedLines[j].id,
							line1HasTrack: result1.endpoint === 'start',
							line1HasEndtrack: result1.endpoint === 'end',
							line2HasTrack: result2.endpoint === 'start',
							line2HasEndtrack: result2.endpoint === 'end'
						});

						allIntersectionPoints.push(intersectionPoint);
					}
				}
			}
		}

		const mergedPoints = IntersectionFunctions.mergeCloseIntersectionPoints(allIntersectionPoints);

		return {
			lines: updatedLines,
			points: mergedPoints,
			info: mergedPoints.map(point => ({
				id: point.id,
				x: point.x,
				y: point.y,
				intersectionCount: point.intersections.length,
				intersections: point.intersections
			}))
		};
	},

	splitAllIntersectingLines: (lines) => {
		const splitPointsMap = new Map();

		for (let i = 0; i < lines.length; i++) {
			for (let j = i + 1; j < lines.length; j++) {
				const intersection = Utils.lineIntersection(
					lines[i].start, lines[i].end,
					lines[j].start, lines[j].end
				);

				if (intersection) {
					const isOnLine1 = Utils.isPointOnLineSegment(intersection, lines[i].start, lines[i].end, 3);
					const isOnLine2 = Utils.isPointOnLineSegment(intersection, lines[j].start, lines[j].end, 3);

					if (isOnLine1 && isOnLine2) {
						if (!splitPointsMap.has(lines[i].id)) splitPointsMap.set(lines[i].id, []);
						if (!splitPointsMap.has(lines[j].id)) splitPointsMap.set(lines[j].id, []);

						const points1 = splitPointsMap.get(lines[i].id);
						const points2 = splitPointsMap.get(lines[j].id);

						let exists1 = false;
						let exists2 = false;

						for (const point of points1) {
							if (Utils.distance(point, intersection) < 5) {
								exists1 = true;
								break;
							}
						}

						for (const point of points2) {
							if (Utils.distance(point, intersection) < 5) {
								exists2 = true;
								break;
							}
						}

						if (!exists1) points1.push({ ...intersection });
						if (!exists2) points2.push({ ...intersection });
					}
				}
			}
		}

		if (splitPointsMap.size === 0) {
			return { lines: [...lines], changed: false };
		}

		const newLines = [];
		const processedLineIds = new Set();

		lines.forEach(line => {
			if (!splitPointsMap.has(line.id) || splitPointsMap.get(line.id).length === 0) {
				if (!processedLineIds.has(line.id)) {
					newLines.push({ ...line });
					processedLineIds.add(line.id);
				}
				return;
			}

			const points = splitPointsMap.get(line.id);
			const allPoints = [
				{ x: line.start.x, y: line.start.y, isEndpoint: true },
				...points.map(p => ({ x: p.x, y: p.y, isEndpoint: false })),
				{ x: line.end.x, y: line.end.y, isEndpoint: true }
			];

			allPoints.sort((a, b) => {
				return Utils.distance(a, line.start) - Utils.distance(b, line.start);
			});

			const uniquePoints = [];
			for (const point of allPoints) {
				let isDuplicate = false;
				for (const uniquePoint of uniquePoints) {
					if (Utils.distance(point, uniquePoint) < 5) {
						isDuplicate = true;
						break;
					}
				}
				if (!isDuplicate) uniquePoints.push(point);
			}

			for (let i = 0; i < uniquePoints.length - 1; i++) {
				const segmentLength = Utils.distance(uniquePoints[i], uniquePoints[i + 1]);
				if (segmentLength > 5) {
					const newLine = {
						...line,
						id: Date.now() + Math.random() + i,
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
		});

		return { lines: newLines, changed: true };
	}
};

// ==================== РЕДАКТОР (ФУНКЦИОНАЛЬНЫЙ) ====================
const createEditor = (canvasId) => {
	// Состояние редактора
	let state = {
		canvas: document.getElementById(canvasId),
		ctx: null,
		bufferCanvas: document.createElement('canvas'),
		bufferCtx: null,
		mode: 'draw',
		lineColor: '#ffffff',
		lineWidth: 10,
		snapToGrid: true,
		snapToPoints: true,
		gridSize: 20,
		currentObjectType: null,
		isDrawing: false,
		isMoving: false,
		isEditing: false,
		selectedElement: null,
		dragOffset: { x: 0, y: 0 },
		editingPoint: null,
		editingLength: false,
		lengthEditOverlay: null,
		lines: [],
		objects: [],
		tempLine: null,
		intersectionPoints: [],
		intersectionInfo: [],
		showIntersections: false,
		showTrackProperties: false,
		showEndpoints: true,
		animationFrameId: null,
		mousePos: { x: 0, y: 0 },
		needsRedraw: true
	};

	state.ctx = state.canvas.getContext('2d');
	state.bufferCtx = state.bufferCanvas.getContext('2d');

	// Чистые функции для обновления состояния
	const updateState = (updates) => {
		state = { ...state, ...updates };
	};

	const updateLines = (newLines) => {
		updateState({ lines: newLines });
	};

	const updateObjects = (newObjects) => {
		updateState({ objects: newObjects });
	};

	const updateIntersectionPoints = (newPoints) => {
		updateState({ intersectionPoints: newPoints });
	};

	// Функции поиска элементов
	const findLineAtPoint = (pos, tolerance = 10) => {
		for (let line of state.lines) {
			if (Utils.distance(pos, line.start) < tolerance ||
				Utils.distance(pos, line.end) < tolerance) {
				return line;
			}

			const { start, end } = line;
			const A = pos.x - start.x;
			const B = pos.y - start.y;
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

			if (Utils.distance(pos, { x: xx, y: yy }) < tolerance) {
				return line;
			}
		}
		return null;
	};

	const findObjectAtPoint = (pos) => {
		for (let i = state.objects.length - 1; i >= 0; i--) {
			const obj = state.objects[i];
			if (Utils.isPointInsideRect(pos, obj)) {
				return obj;
			}
		}
		return null;
	};

	const findIntersectionPointAtPosition = (pos, tolerance = 10) => {
		for (let point of state.intersectionPoints) {
			if (Utils.distance(point, pos) < tolerance) {
				return point;
			}
		}
		return null;
	};

	const findClosestPoint = (x, y, maxDistance) => {
		let closestDistance = maxDistance;
		let closestPoint = null;

		state.lines.forEach(line => {
			[line.start, line.end].forEach(point => {
				const distance = Utils.distance({ x, y }, point);
				if (distance < closestDistance) {
					closestDistance = distance;
					closestPoint = point;
				}
			});
		});

		state.objects.forEach(obj => {
			const points = [
				{ x: obj.x, y: obj.y },
				{ x: obj.x + obj.width, y: obj.y },
				{ x: obj.x, y: obj.y + obj.height },
				{ x: obj.x + obj.width, y: obj.y + obj.height }
			];

			points.forEach(point => {
				const distance = Utils.distance({ x, y }, point);
				if (distance < closestDistance) {
					closestDistance = distance;
					closestPoint = point;
				}
			});
		});

		return closestPoint;
	};

	// Функции работы с мышью
	const getMousePos = (e) => {
		const rect = state.canvas.getBoundingClientRect();
		const scaleX = state.canvas.width / rect.width;
		const scaleY = state.canvas.height / rect.height;

		const mousePos = {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY
		};

		updateState({ mousePos });
		return mousePos;
	};

	const snapPosition = (x, y) => {
		let snappedX = x;
		let snappedY = y;

		if (state.snapToGrid) {
			const snapped = Utils.snapToGrid(x, y, state.gridSize);
			snappedX = snapped.x;
			snappedY = snapped.y;
		}

		if (state.snapToPoints) {
			const closestPoint = findClosestPoint(x, y, 15);
			if (closestPoint) {
				snappedX = closestPoint.x;
				snappedY = closestPoint.y;
			}
		}

		return { x: snappedX, y: snappedY };
	};

	// Функции рисования
	const startDrawing = (pos) => {
		updateState({
			isDrawing: true,
			tempLine: {
				id: Date.now() + Math.random(),
				start: { ...pos },
				end: { ...pos },
				color: state.lineColor,
				width: state.lineWidth,
				track: [],
				endtrack: [],
				passability: {}
			}
		});
	};

	const continueDrawing = (pos) => {
		if (!state.isDrawing || !state.tempLine) return;

		const dx = pos.x - state.tempLine.end.x;
		const dy = pos.y - state.tempLine.end.y;
		if (Math.hypot(dx, dy) < 1) return;

		updateState({
			tempLine: {
				...state.tempLine,
				end: { ...pos }
			}
		});

		if (state.animationFrameId) {
			cancelAnimationFrame(state.animationFrameId);
		}

		state.animationFrameId = requestAnimationFrame(() => {
			redraw();
			state.animationFrameId = null;
		});
	};

	const finishDrawing = () => {
		if (state.animationFrameId) {
			cancelAnimationFrame(state.animationFrameId);
			updateState({ animationFrameId: null });
		}

		if (state.isDrawing && state.tempLine) {
			const length = Utils.calculateLineLength(state.tempLine);

			if (length > 5) {
				const newLines = [...state.lines, { ...state.tempLine, id: Date.now() + Math.random() }];
				updateLines(newLines);

				const splitResult = IntersectionFunctions.splitAllIntersectingLines(newLines);
				if (splitResult.changed) {
					console.log('Линии были разбиты после добавления новой линии');
					updateLines(splitResult.lines);
				}

				updateStats();
			}

			updateState({
				tempLine: null,
				isDrawing: false,
				needsRedraw: true
			});
			redraw();
		}
	};

	// Функции перемещения и редактирования
	const startMoving = (pos) => {
		const selectedElement = findObjectAtPoint(pos) || findLineAtPoint(pos);

		if (selectedElement) {
			const targetPoint = selectedElement.start ? selectedElement.start : selectedElement;
			updateState({
				selectedElement,
				isMoving: true,
				dragOffset: {
					x: pos.x - targetPoint.x,
					y: pos.y - targetPoint.y
				},
				needsRedraw: true
			});
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
			state.selectedElement.x = pos.x - state.dragOffset.x;
			state.selectedElement.y = pos.y - state.dragOffset.y;
		}

		updateState({ needsRedraw: true });
		redraw();
	};

	const startEditing = (pos) => {
		const selectedElement = findObjectAtPoint(pos);

		if (selectedElement) {
			showPropertiesPanel(selectedElement);
			return;
		}

		const line = findLineAtPoint(pos);
		if (line) {
			const distToStart = Utils.distance(pos, line.start);
			const distToEnd = Utils.distance(pos, line.end);

			if (distToStart < 10 || distToEnd < 10) {
				updateState({
					selectedElement: line,
					isEditing: true,
					editingPoint: distToStart < distToEnd ? 'start' : 'end',
					dragOffset: {
						x: pos.x - line[distToStart < distToEnd ? 'start' : 'end'].x,
						y: pos.y - line[distToStart < distToEnd ? 'start' : 'end'].y
					}
				});
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

		updateState({ needsRedraw: true });
		redraw();
	};

	const finishInteraction = () => {
		updateState({
			isMoving: false,
			isEditing: false,
			editingPoint: null,
			dragOffset: { x: 0, y: 0 }
		});
	};

	// Функции удаления
	const deleteAtPosition = (pos) => {
		const objectToDelete = findObjectAtPoint(pos);
		if (objectToDelete) {
			const newObjects = state.objects.filter(obj => obj !== objectToDelete);
			updateObjects(newObjects);
			hidePropertiesPanel();
			updateStats();
			updateState({ needsRedraw: true });
			redraw();
			return;
		}

		const lineToDelete = findLineAtPoint(pos);
		if (lineToDelete) {
			const newLines = state.lines.filter(line => line !== lineToDelete);
			updateLines(newLines);
			hideLinePropertiesPanel();
			updateStats();
			updateState({ needsRedraw: true });
			redraw();
		}
	};

	// Отрисовка
	const redraw = () => {
		const { ctx, bufferCtx, bufferCanvas, canvas } = state;

		if (bufferCanvas.width !== canvas.width || bufferCanvas.height !== canvas.height) {
			bufferCanvas.width = canvas.width;
			bufferCanvas.height = canvas.height;
			updateState({ needsRedraw: true });
		}

		if (state.needsRedraw) {
			bufferCtx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);

			if (state.snapToGrid) {
				DrawingFunctions.drawGrid(bufferCtx, canvas.width, canvas.height, state.gridSize);
			}

			state.lines.forEach(line => {
				DrawingFunctions.drawLine(bufferCtx, line);
				DrawingFunctions.drawLineLength(bufferCtx, line);
				DrawingFunctions.drawLineProperties(bufferCtx, line);
			});

			if (state.showEndpoints) {
				DrawingFunctions.drawAllEndpoints(bufferCtx, state.lines);
			}

			state.objects.forEach(obj => DrawingFunctions.drawObject(bufferCtx, obj));

			if (state.showIntersections && state.intersectionPoints.length > 0) {
				DrawingFunctions.drawIntersectionPoints(
					bufferCtx,
					state.intersectionPoints,
					state.selectedElement && state.selectedElement.id ? state.selectedElement.id : null
				);
			}

			updateState({ needsRedraw: false });
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(bufferCanvas, 0, 0);

		if (state.showTrackProperties) {
			DrawingFunctions.drawTrackProperties(ctx, state.lines, state.intersectionPoints);
			DrawingFunctions.drawPassabilityProperties(ctx, state.lines, state.intersectionPoints);
		}

		if (state.tempLine) {
			drawTemporaryLine();
		} else if (state.selectedElement) {
			DrawingFunctions.drawHighlight(ctx, state.selectedElement);
		}

		if (state.selectedElement && state.selectedElement.start && state.selectedElement.end) {
			drawSelectedLineEndpoints();
		}
	};

	const drawTemporaryLine = () => {
		const { ctx, bufferCanvas, tempLine } = state;

		ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
		ctx.drawImage(bufferCanvas, 0, 0);

		if (tempLine) {
			ctx.save();

			const dx = tempLine.end.x - tempLine.start.x;
			const dy = tempLine.end.y - tempLine.start.y;
			const length = Math.hypot(dx, dy);

			if (length > 0) {
				const angle = Math.atan2(dy, dx);
				const lineWidth = tempLine.width || 5;

				ctx.translate(tempLine.start.x, tempLine.start.y);
				ctx.rotate(angle);

				ctx.fillStyle = 'rgba(128, 128, 128, 0.2)';
				ctx.fillRect(0, -lineWidth / 2, length, lineWidth);

				ctx.strokeStyle = 'red';
				ctx.lineWidth = 1;
				ctx.strokeRect(0, -lineWidth / 2, length, lineWidth);
			}

			ctx.restore();

			DrawingFunctions.drawStartEndpoint(ctx, tempLine.start);
			DrawingFunctions.drawEndEndpoint(ctx, tempLine.end);

			const midPoint = {
				x: (tempLine.start.x + tempLine.end.x) / 2,
				y: (tempLine.start.y + tempLine.end.y) / 2
			};
			const realLength = Utils.calculateLineLength(tempLine);

			ctx.save();
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'red';
			ctx.font = 'bold 12px Arial';
			ctx.fillText(`${realLength.toFixed(1)}m`, midPoint.x, midPoint.y - 15);
			ctx.restore();
		}

		if (state.selectedElement) {
			DrawingFunctions.drawHighlight(ctx, state.selectedElement);
		}
	};

	const drawSelectedLineEndpoints = () => {
		const { ctx, selectedElement } = state;
		if (!selectedElement || !selectedElement.start || !selectedElement.end) return;

		ctx.save();

		ctx.fillStyle = '#00ff00';
		ctx.beginPath();
		ctx.arc(selectedElement.start.x, selectedElement.start.y, 8, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 12px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('С', selectedElement.start.x, selectedElement.start.y);

		ctx.fillStyle = '#ff0000';
		ctx.beginPath();
		ctx.arc(selectedElement.end.x, selectedElement.end.y, 8, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 12px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('К', selectedElement.end.x, selectedElement.end.y);

		ctx.restore();
	};

	// Обработчики событий
	const handleMouseDown = (e) => {
		const mousePos = getMousePos(e);
		const snappedPos = snapPosition(mousePos.x, mousePos.y);

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

	// Панели свойств
	const showPropertiesPanel = (obj) => {
		const panel = document.getElementById('propertiesPanel');
		const labelInput = document.getElementById('propertyLabel');
		const widthInput = document.getElementById('propertyWidth');
		const heightInput = document.getElementById('propertyHeight');

		if (!panel || !labelInput || !widthInput || !heightInput) return;

		labelInput.value = obj.label;
		widthInput.value = obj.width;
		heightInput.value = obj.height;
		panel.style.display = 'block';
		updateState({ selectedElement: obj });
	};

	const hidePropertiesPanel = () => {
		const panel = document.getElementById('propertiesPanel');
		if (panel) panel.style.display = 'none';
		updateState({ selectedElement: null });
	};

	const showLinePropertiesPanel = (line) => {
		const panel = document.getElementById('linePropertiesPanel');
		const cheightInput = document.getElementById('lineCheight');
		const cwidthInput = document.getElementById('lineCwidth');
		const cvolumeInput = document.getElementById('lineCvolume');
		const lengthInput = document.getElementById('lineLength');

		if (!panel || !cheightInput || !cwidthInput || !cvolumeInput || !lengthInput) return;

		cheightInput.value = line.cheight || '';
		cwidthInput.value = line.cwidth || '';
		cvolumeInput.value = line.cvolume || '';
		lengthInput.value = `${Utils.calculateLineLength(line).toFixed(1)}m`;
		panel.style.display = 'block';
		updateState({ selectedElement: line });
	};

	const hideLinePropertiesPanel = () => {
		const panel = document.getElementById('linePropertiesPanel');
		if (panel) panel.style.display = 'none';
		updateState({ selectedElement: null });
	};

	// Функции работы с объектами
	const addObject = (type, x, y) => {
		const obj = ObjectFactory.createObject(type, x, y);
		const newObjects = [...state.objects, obj];
		updateObjects(newObjects);
		updateState({ needsRedraw: true });
		updateStats();
		redraw();
	};

	// Редактирование длины линии
	const startLengthEditing = (line, pos) => {
		updateState({ editingLength: true, selectedElement: line });

		if (state.lengthEditOverlay) {
			document.body.removeChild(state.lengthEditOverlay);
		}

		const overlay = document.createElement('div');
		overlay.className = 'length-edit-overlay';

		const input = document.createElement('input');
		input.type = 'text';
		input.value = line.customLength || '';
		input.placeholder = 'Длина в m';

		const button = document.createElement('button');
		button.textContent = 'OK';

		const rect = state.canvas.getBoundingClientRect();
		const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
		const scrollY = window.pageYOffset || document.documentElement.scrollTop;

		overlay.style.left = (rect.left + pos.x + scrollX) + 'px';
		overlay.style.top = (rect.top + pos.y + scrollY) + 'px';

		overlay.appendChild(input);
		overlay.appendChild(button);
		document.body.appendChild(overlay);

		input.focus();
		input.select();

		const applyLength = () => {
			const newLength = input.value.trim();
			if (newLength && !isNaN(newLength)) {
				line.customLength = Number(newLength);
			} else {
				delete line.customLength;
			}
			updateState({ needsRedraw: true });
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
				if (overlay && !overlay.contains(e.target)) {
					finishLengthEditing();
					document.removeEventListener('mousedown', closeHandler);
				}
			};
			document.addEventListener('mousedown', closeHandler);
		}, 100);

		updateState({ lengthEditOverlay: overlay });
	};

	const finishLengthEditing = () => {
		updateState({ editingLength: false });
		if (state.lengthEditOverlay) {
			document.body.removeChild(state.lengthEditOverlay);
			updateState({ lengthEditOverlay: null });
		}
	};

	// Функции UI
	const setMode = (mode) => {
		updateState({ mode });

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

		const cursors = {
			'draw': 'crosshair',
			'move': 'move',
			'edit': 'pointer',
			'delete': 'not-allowed'
		};
		state.canvas.style.cursor = cursors[mode] || 'default';
	};

	const setColor = (color) => {
		updateState({ lineColor: color });

		document.querySelectorAll('.color-btn').forEach(btn => {
			btn.classList.remove('active');
		});

		const colorBtn = document.querySelector(`[data-color="${color}"]`);
		if (colorBtn) colorBtn.classList.add('active');

		const currentColor = document.getElementById('currentColor');
		if (currentColor) currentColor.textContent = color;
	};

	// Функции пересечений
	const findIntersections = () => {
		const result = IntersectionFunctions.findIntersections(state.lines);
		updateLines(result.lines);
		updateIntersectionPoints(result.points);
		updateState({
			intersectionInfo: result.info,
			showIntersections: true,
			needsRedraw: true
		});
		updateStats();
		redraw();
		return result.points;
	};

	const clearIntersections = () => {
		updateIntersectionPoints([]);
		updateState({
			intersectionInfo: [],
			showIntersections: false,
			needsRedraw: true
		});
		IntersectionPoint.resetCounter();
		updateStats();
		redraw();
	};

	const toggleIntersections = () => {
		updateState({
			showIntersections: !state.showIntersections,
			needsRedraw: true
		});
		const toggleButton = document.getElementById('toggleIntersections');
		if (toggleButton) {
			toggleButton.textContent = state.showIntersections ?
				'Скрыть пересечения' : 'Показать пересечения';
		}
		redraw();
	};

	// Функции свойств линий
	const updateLineTrackProperties = () => {
		const newLines = state.lines.map(line => ({
			...line,
			track: [],
			endtrack: [],
			passability: {}
		}));

		updateLines(newLines);

		state.intersectionPoints.forEach(point => {
			point.intersections.forEach(intersection => {
				if (intersection.type === 'line-line') {
					const line1Index = newLines.findIndex(l => l.id === intersection.line1Id);
					const line2Index = newLines.findIndex(l => l.id === intersection.line2Id);

					if (line1Index !== -1) {
						if (intersection.line1Endpoint === 'start') {
							if (!newLines[line1Index].track.includes(point.id)) {
								newLines[line1Index].track.push(point.id);
							}
							newLines[line1Index].passability[point.id] = 5;
						} else if (intersection.line1Endpoint === 'end') {
							if (!newLines[line1Index].endtrack.includes(point.id)) {
								newLines[line1Index].endtrack.push(point.id);
							}
							newLines[line1Index].passability[point.id] = 10;
						} else {
							newLines[line1Index].passability[point.id] = 0;
						}
					}

					if (line2Index !== -1) {
						if (intersection.line2Endpoint === 'start') {
							if (!newLines[line2Index].track.includes(point.id)) {
								newLines[line2Index].track.push(point.id);
							}
							newLines[line2Index].passability[point.id] = 5;
						} else if (intersection.line2Endpoint === 'end') {
							if (!newLines[line2Index].endtrack.includes(point.id)) {
								newLines[line2Index].endtrack.push(point.id);
							}
							newLines[line2Index].passability[point.id] = 10;
						} else {
							newLines[line2Index].passability[point.id] = 0;
						}
					}
				}
			});
		});

		newLines.forEach(line => {
			if (Object.keys(line.passability).length === 0) {
				line.passability.default = 0;
			}
		});

		updateLines(newLines);
		updateState({ needsRedraw: true });
		redraw();
	};

	// Функции информации
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

					switch (intersection.line1Endpoint) {
						case 'start': message += `    Линия 1 подходит НАЧАЛОМ к точке\n`; break;
						case 'end': message += `    Линия 1 подходит КОНЦОМ к точке\n`; break;
						case 'middle': message += `    Точка в СЕРЕДИНЕ линии 1\n`; break;
						default: message += `    Неизвестно каким концом (линия 1)\n`;
					}

					message += `  Линия 2 (ID: ${intersection.line2Id || 'нет'}): `;
					message += `(${intersection.line2.start.x.toFixed(1)},${intersection.line2.start.y.toFixed(1)}) - `;
					message += `(${intersection.line2.end.x.toFixed(1)},${intersection.line2.end.y.toFixed(1)})\n`;

					switch (intersection.line2Endpoint) {
						case 'start': message += `    Линия 2 подходит НАЧАЛОМ к точке\n`; break;
						case 'end': message += `    Линия 2 подходит КОНЦОМ к точке\n`; break;
						case 'middle': message += `    Точка в СЕРЕДИНЕ линии 2\n`; break;
						default: message += `    Неизвестно каким концом (линия 2)\n`;
					}
				}
			});
		} else {
			message += "Нет деталей о пересечениях";
		}

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

		updateState({ selectedElement: point, needsRedraw: true });
		redraw();
	};

	// Обновление статистики
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

	// Инициализация
	const init = () => {
		setupEventListeners();
		setupUI();
		setupObjectLibrary();
		handleResize();
		redraw();
	};

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

	const handleResize = () => {
		const container = state.canvas.parentElement;
		const width = container.clientWidth - 40;
		const height = container.clientHeight - 80;

		if (state.canvas.width !== width || state.canvas.height !== height) {
			state.canvas.width = width;
			state.canvas.height = height;
			updateState({ needsRedraw: true });
			redraw();
		}
	};

	const setupUI = () => {
		// Режимы
		document.querySelectorAll('.mode-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				setMode(e.target.dataset.mode);
				updateState({ currentObjectType: null });
				document.querySelectorAll('.object-item').forEach(item => {
					item.classList.remove('selected');
				});
				hidePropertiesPanel();
				hideLinePropertiesPanel();
			});
		});

		// Цвета
		document.querySelectorAll('.color-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				setColor(e.target.dataset.color);
			});
		});

		// Привязка
		const snapToGrid = document.getElementById('snapToGrid');
		if (snapToGrid) {
			snapToGrid.addEventListener('change', (e) => {
				updateState({ snapToGrid: e.target.checked, needsRedraw: true });
				redraw();
			});
		}

		const snapToPoints = document.getElementById('snapToPoints');
		if (snapToPoints) {
			snapToPoints.addEventListener('change', (e) => {
				updateState({ snapToPoints: e.target.checked });
			});
		}

		// Ширина линии
		const lineWidthInput = document.getElementById('lineWidth');
		if (lineWidthInput) {
			lineWidthInput.addEventListener('change', (e) => {
				updateState({ lineWidth: parseInt(e.target.value) || 5 });
			});
		}

		// Действия
		const actions = {
			'clearAll': () => clearAll(),
			'showAllLines': () => logAllLines(),
			'findIntersections': () => findIntersections(),
			'savePDF': () => saveAsPDF(),
			'clearIntersections': () => clearIntersections(),
			'toggleIntersections': () => toggleIntersections(),
			'toggleTrackProperties': () => toggleTrackProperties(),
			'showLineTrackInfo': () => showLineTrackInfoHandler(),
			'updateAllTrackProperties': () => updateLineTrackProperties(),
			'exportAllLinesData': () => exportAllLinesData(),
			'updatePassability': () => updatePassabilityForAllLines(),
			'showPassabilityInfo': () => showPassabilityInfoHandler(),
			'exportIntersections': () => exportIntersectionData(),
			'toggleEndpoints': () => toggleEndpoints()
		};

		Object.entries(actions).forEach(([id, handler]) => {
			const element = document.getElementById(id);
			if (element) {
				element.addEventListener('click', handler);
			}
		});

		// Свойства объектов
		const applyProperties = document.getElementById('applyProperties');
		if (applyProperties) {
			applyProperties.addEventListener('click', applyObjectProperties);
		}

		const cancelProperties = document.getElementById('cancelProperties');
		if (cancelProperties) {
			cancelProperties.addEventListener('click', hidePropertiesPanel);
		}

		const rotateButton = document.getElementById('rotateButton');
		if (rotateButton) {
			rotateButton.addEventListener('click', rotateSelectedObject);
		}

		// Свойства линий
		const applyLineProperties = document.getElementById('applyLineProperties');
		if (applyLineProperties) {
			applyLineProperties.addEventListener('click', applyLinePropertiesHandler);
		}

		const cancelLineProperties = document.getElementById('cancelLineProperties');
		if (cancelLineProperties) {
			cancelLineProperties.addEventListener('click', hideLinePropertiesPanel);
		}

		const showLineProperties = document.getElementById('showLineProperties');
		if (showLineProperties) {
			showLineProperties.addEventListener('click', showAllLinesProperties);
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
				updateState({ currentObjectType: objInfo.type });
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

	// Дополнительные функции
	const clearAll = () => {
		if (confirm('Вы уверены, что хотите очистить всё?')) {
			updateLines([]);
			updateObjects([]);
			updateIntersectionPoints([]);
			updateState({
				intersectionInfo: [],
				needsRedraw: true
			});
			IntersectionPoint.resetCounter();
			hidePropertiesPanel();
			hideLinePropertiesPanel();
			updateStats();
			redraw();
		}
	};

	const logAllLines = () => {
		console.log('Линии:', state.lines);
		console.log('Объекты:', state.objects);
		alert(`Линий: ${state.lines.length}, Объектов: ${state.objects.length}`);
	};

	const toggleEndpoints = () => {
		updateState({
			showEndpoints: !state.showEndpoints,
			needsRedraw: true
		});
		const toggleButton = document.getElementById('toggleEndpoints');
		if (toggleButton) {
			toggleButton.textContent = state.showEndpoints ?
				'Скрыть маркеры концов' : 'Показать маркеры концов';
		}
		redraw();
	};

	const applyObjectProperties = () => {
		if (!state.selectedElement) return;

		const labelInput = document.getElementById('propertyLabel');
		const widthInput = document.getElementById('propertyWidth');
		const heightInput = document.getElementById('propertyHeight');

		if (!labelInput || !widthInput || !heightInput) return;

		state.selectedElement.label = labelInput.value;
		state.selectedElement.width = parseInt(widthInput.value);
		state.selectedElement.height = parseInt(heightInput.value);

		updateState({ needsRedraw: true });
		redraw();
	};

	const applyLinePropertiesHandler = () => {
		if (!state.selectedElement || !state.selectedElement.start) return;

		const cheightInput = document.getElementById('lineCheight');
		const cwidthInput = document.getElementById('lineCwidth');
		const cvolumeInput = document.getElementById('lineCvolume');

		if (!cheightInput || !cwidthInput || !cvolumeInput) return;

		state.selectedElement.cheight = cheightInput.value ? parseFloat(cheightInput.value) : null;
		state.selectedElement.cwidth = cwidthInput.value ? parseFloat(cwidthInput.value) : null;
		state.selectedElement.cvolume = cvolumeInput.value ? parseFloat(cvolumeInput.value) : null;

		updateState({ needsRedraw: true });
		redraw();
		hideLinePropertiesPanel();
	};

	const rotateSelectedObject = () => {
		if (!state.selectedElement) return;
		state.selectedElement.rotation = (state.selectedElement.rotation + 90) % 360;
		updateState({ needsRedraw: true });
		redraw();
	};

	const toggleTrackProperties = () => {
		updateState({
			showTrackProperties: !state.showTrackProperties,
			needsRedraw: true
		});
		const toggleButton = document.getElementById('toggleTrackProperties');
		if (toggleButton) {
			toggleButton.textContent = state.showTrackProperties ?
				'Скрыть свойства линий' : 'Показать свойства линий';
		}
		redraw();
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
		message += `Длина: ${Utils.calculateLineLength(line).toFixed(1)}px\n\n`;

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

		console.log(message);
		alert(message);
	};

	const updatePassabilityForAllLines = () => {
		const newLines = state.lines.map(line => {
			const newLine = { ...line };
			newLine.passability = {};

			state.intersectionPoints.forEach(point => {
				const intersection = point.intersections.find(intersection => {
					if (intersection.type === 'line-line') {
						return intersection.line1Id === line.id || intersection.line2Id === line.id;
					}
					return false;
				});

				if (intersection) {
					let lineEndpoint;
					if (intersection.line1Id === line.id) {
						lineEndpoint = intersection.line1Endpoint;
					} else if (intersection.line2Id === line.id) {
						lineEndpoint = intersection.line2Endpoint;
					}

					if (lineEndpoint === 'start') {
						newLine.passability[point.id] = 5;
					} else if (lineEndpoint === 'end') {
						newLine.passability[point.id] = 10;
					} else if (lineEndpoint === 'middle') {
						newLine.passability[point.id] = 0;
					}
				}
			});

			if (Object.keys(newLine.passability).length === 0) {
				newLine.passability.default = 0;
			}

			return newLine;
		});

		updateLines(newLines);
		updateState({ needsRedraw: true });
		redraw();
	};

	const showPassabilityInfoHandler = () => {
		if (state.selectedElement && state.selectedElement.start && state.selectedElement.end) {
			showPassabilityInfo(state.selectedElement);
		} else {
			alert('Выберите линию для просмотра свойств passability');
		}
	};

	const showPassabilityInfo = (line) => {
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

	const exportAllLinesData = () => {
		const data = state.lines.map(line => ({
			id: line.id,
			start: { ...line.start },
			end: { ...line.end },
			color: line.color,
			width: line.width,
			cheight: line.cheight,
			cwidth: line.cwidth,
			cvolume: line.cvolume,
			customLength: line.customLength,
			realLength: Utils.calculateLineLength(line),
			track: line.track || [],
			endtrack: line.endtrack || [],
			passability: line.passability || {}
		}));

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

		alert('Данные о линиях экспортированы в файл "линии_данные.json"');
	};

	const exportIntersectionData = () => {
		const data = state.intersectionPoints.map(point => ({
			id: point.id,
			x: point.x,
			y: point.y,
			intersectionCount: point.intersections.length,
			intersections: point.intersections
		}));

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

		alert('Данные о точках пересечения экспортированы в файл "точки_пересечения.json"');
	};

	const showAllLinesProperties = () => {
		const linesProperties = state.lines.map(line => ({
			id: line.id,
			start: { ...line.start },
			end: { ...line.end },
			color: line.color,
			width: line.width,
			cheight: line.cheight,
			cwidth: line.cwidth,
			cvolume: line.cvolume,
			customLength: line.customLength,
			realLength: Utils.calculateLineLength(line),
			track: line.track || [],
			endtrack: line.endtrack || [],
			passability: line.passability || {}
		}));

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

	// Публичный API
	return {
		init,
		redraw,
		getState: () => ({ ...state }),
		setMode,
		setColor,
		addObject,
		findIntersections,
		clearIntersections,
		toggleIntersections,
		clearAll,
		updateLineTrackProperties,
		updateStats
	};
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
	const editor = createEditor('drawingCanvas');
	window.editor = editor;
	editor.init();

	setTimeout(() => editor.redraw(), 100);
});