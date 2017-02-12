(function (factory) {

    if ( typeof define === 'function' && define.amd ) {

        // AMD. Register as an anonymous module.
        define([], factory);

    } else if ( typeof exports === 'object' ) {

        // Node/CommonJS
        module.exports = factory();

    } else {

        // Browser globals
        window.Picker = factory();
    }

}(function( ){

	'use strict';

	Date.prototype.null = function ( ) {
		this.setHours(0,0,0,0);
		return this;
	};

	Date.prototype.addDays = function ( days ) {
		this.setDate(this.getDate() + days);
		return this;
	};

	Date.prototype.addMonths = function ( months ) {
		this.setMonth(this.getMonth() + months);
		return this;
	};

	var Classes = {
		calendar: 'dp-calendar',
		monthHeader: 'dp-month-header',
		monthName: 'dp-month-name',
		dayNames: 'dp-day-names',
		dayName: 'dp-day-name',
		button: 'dp-button',
		decrease: 'dp-decrease',
		increase: 'dp-increase',
		table: 'dp-table',
		row: 'dp-row',
		cell: 'dp-cell',
		week: 'dp-week',
		date: 'dp-date',
		isOtherMonth: 'dp-is-other-month',
		isCurrentMonth: 'dp-is-current-month',
		isEdge: 'dp-is-edge',
		isStart: 'dp-is-start',
		isOutside: 'dp-is-outside',
		isBeforeStart: 'dp-is-before-start',
		isEdge: 'dp-is-edge',
		isEnd: 'dp-is-end',
		isOutside: 'dp-is-outside',
		isAfterEnd: 'dp-is-after-end',
		isOk: 'dp-is-ok'
	};

	//
	function copy ( y, m, d ) {

		if ( y instanceof Date ) {
			d = y.getDate();
			m = y.getMonth();
			y = y.getFullYear();
		}

		return new Date(y,m,d,0,0,0,0);
	}

	// http://stackoverflow.com/questions/4156434/javascript-get-the-first-day-of-the-week-from-current-date
	function getMonday ( d ) {

		d = new Date(d);

		var day = d.getDay();
		var diff = d.getDate() - day + (day == 0 ? -6 : 1);

		return new Date(d.setDate(diff));
	}

	// Convert NodeList (or similar) to Array
	function toArray ( n ) {
		return Array.prototype.slice.call(n);
	}

	//
	function pad ( a ) {
		var str = String(a);
		var pad = '00';
		return pad.substring(0, pad.length - str.length) + str;
	}

	//
	function isValidDate ( dt ) {
		return Object.prototype.toString.call(dt) === "[object Date]" && !isNaN(dt.getTime());
	}

	//
	function isSameMonth ( dt, dt2 ) {
		return dt.getMonth() === dt2.getMonth() && dt.getFullYear() === dt2.getFullYear();
	}

	// Generate month name and buttons
	function renderMonthHeader ( dt, index, opt, paintPrev, paintNext ) {

		var html = '';

		html += '<div class="' + Classes.monthHeader + '">';
		
		if ( (!index || !opt.twoCalendars) && paintPrev ) {
			html += '<div class="' + Classes.button + ' ' + Classes.decrease + '">' + opt.icon + '</div>';
		}
		
		html += '<div class="' + Classes.monthName + '">' + opt.monthNames[dt.getMonth()] + ' ' + dt.getFullYear() + '</div>';
		
		if ( (index || !opt.twoCalendars) && paintNext ) {
			html += '<div class="' + Classes.button + ' ' + Classes.increase + '">' + opt.icon + '</div>';
		}
		
		html += '</div>';

		return html;
	}

	// Unique ID for a date cell
	function getCalcForDate ( dt ) {
		return dt.getFullYear() + '' + pad(dt.getMonth()) + '' + pad(dt.getDate());
	}

	// Creates a new Date from the data-* properties on a cell
	function getDateFromCell ( cell ) {

		if ( cell ) {
			return copy(
				cell.getAttribute('data-year'),
				cell.getAttribute('data-month'),
				cell.getAttribute('data-date')
			);
		}

		return false;
	}
	
	// Generate data-attributes for date cells
	function renderDateAttributes ( dt ) {
		return 'data-calc="' + getCalcForDate(dt) + '" ' +
			'data-day="' + dt.getDay() + '" ' +
			'data-date="' + dt.getDate() + '" ' +
			'data-month="' + dt.getMonth() + '" ' +
			'data-year="' + dt.getFullYear() + '"';
	}

	// Add cells for all dates
	function renderDatesInMonth ( firstDayOfMonth, classifier ) {

		var currentDate = getMonday(firstDayOfMonth);
		var html = '';

		for ( var i = 0; i < 6; i++ ) {

			html += '<tr class="' + Classes.row + ' ' + Classes.week + '">';

			for ( var j = 0; j < 7; j++ ) {
				html += '<td ' + classifier(currentDate, firstDayOfMonth) +'>' + currentDate.getDate() + '</td>';
				currentDate.addDays(1);
			}

			html += '</tr>';
		}

		return html + '';
	}

	// Create a calendar element for a given date
	function build ( dt, index, opt, paintPrev, paintNext, classifier ) {

		var element = document.createElement('div');
		var html = '';

		html += renderMonthHeader(dt, index, opt, paintPrev, paintNext);
		html += '<table class="' + Classes.table + '">';
		html += '<tr class="' + Classes.row + ' ' + Classes.dayNames + '">' + opt.dayNamesShort.map(function( a ){
			return '<th class="' + Classes.cell + ' ' + Classes.dayName + '">' + a + '</th>';
		}).join('') + '</tr>';
		html += renderDatesInMonth(dt, classifier);
		html += '</table>';

		element.className = Classes.calendar;
		element.innerHTML = html;

		return element;
	}

	// Attach event to element, ignore null elements
	function addEventListener ( element, eventName, listener ) {
		if ( element ) {
			element.addEventListener(eventName, listener);
		}
	}

	// Variables global to Picker are UPPERCASED.
	function Picker ( ROOT, options ) {

		// Copies of input with all time properties set to 0
		var START = copy(options.start).null();
		var END = copy(options.end).null();
		
		// Current calendar date
		var CURRENT = copy(START);

		// TableCell
		// Set in 'handleClickOnValidCell';
		// Set in 'handleEventWithActiveCell';
		var ACTIVE_CELL = false;
		var START_CELL = false;
		var END_CELL = false;

		// Array of TableCell
		// Set in 'markCellsBetweenClickedCells';
		var BETWEEN_CELLS = false;
		
		// Whether the prev and next buttons do anything. Set in 'generateCalendarForCurrent';
		var CAN_NEXT = true;
		var CAN_PREV = true;
		
		// Furthest visible calendar
		var END_LIMIT = getEndLimit(copy(END));
		
		function getEndLimit ( dt ) {

			dt.addMonths(-1);

			if ( options.twoCalendars ) {
				dt.addMonths(-1);
			}
			
			return dt;
		}

		function classify ( currentDate, firstDayOfMonth ) {

			var classes = [Classes.cell, Classes.date];
			var valid = 'true';
			var currentMonth = false;

			if ( currentDate.getMonth() !== firstDayOfMonth.getMonth() ) {
				classes.push(Classes.isOtherMonth);
				valid = 'false';
			} else {
				classes.push(Classes.isCurrentMonth);
				currentMonth = true;
			}

			if ( currentDate.getTime() === START.getTime() ) {
				classes.push(Classes.isEdge);
				classes.push(Classes.isStart);
			} else if ( currentDate < START ) {
				valid = 'false';
				classes.push(Classes.isOutside);
				classes.push(Classes.isBeforeStart);
			} else if ( currentDate.getTime() === END.getTime() ) {
				classes.push(Classes.isEdge);
				classes.push(Classes.isEnd);
			} else if ( currentDate > END ) {
				valid = 'false';
				classes.push(Classes.isOutside);
				classes.push(Classes.isAfterEnd);
			} else if ( currentMonth ) {
				classes.push(Classes.isOk);
			}

			return renderDateAttributes(currentDate) + ' data-valid="' + valid + '" class="' + classes.join(' ') + '"';
		}

		function generateCalendarForCurrent ( ) {

			CURRENT.setDate(1);

			var currentCopy = copy(CURRENT);

			CAN_PREV = currentCopy >= START;
			CAN_NEXT = currentCopy <= END_LIMIT;

			clearClickedCells();

			ROOT.innerHTML = '';
			ROOT.appendChild(build(currentCopy, 0, options, CAN_PREV, CAN_NEXT, classify));

			if ( options.twoCalendars ) {
				ROOT.appendChild(build(currentCopy.addMonths(1), 1, options, CAN_PREV, CAN_NEXT, classify));
			}

			addEventListener(ROOT.querySelector('.' + Classes.decrease), 'click', interfacePrev);
			addEventListener(ROOT.querySelector('.' + Classes.increase), 'click', interfaceNext);
		}

		function clearClickedCells ( ) {

			if ( ACTIVE_CELL ) {
				ACTIVE_CELL.removeAttribute('data-state');
			}

			if ( START_CELL ) {
				START_CELL.removeAttribute('data-state');
			}

			if ( END_CELL ) {
				END_CELL.removeAttribute('data-state');
			}

			if ( BETWEEN_CELLS ) {
				BETWEEN_CELLS.forEach(function(a){
					a.removeAttribute('data-state');
				});
			}

			ACTIVE_CELL = false;
			START_CELL = false;
			END_CELL = false;
			BETWEEN_CELLS = false;
		}

		function markCellsBetweenClickedCells ( minCalcValue, maxCalcValue ) {

			BETWEEN_CELLS = toArray(ROOT.querySelectorAll('.' + Classes.date + '.' + Classes.isCurrentMonth));

			BETWEEN_CELLS.forEach(function( tableCell ){

				var calcValue = Number(tableCell.getAttribute('data-calc'));

				if ( calcValue > minCalcValue && calcValue < maxCalcValue ) {
					tableCell.setAttribute('data-state', 'between');
				}
			});
		}

		function getCellForDate ( dt ) {
			return ROOT.querySelector('[data-calc="' + getCalcForDate(dt) + '"][data-valid="true"]');
		}

		function emitEvent ( name ) {
			if ( options['on' + name] ) {
				options['on' + name].call(API);
			}
		}

		function handleEventWithActiveCell ( cell ) {

			var activeCalcValue = Number(ACTIVE_CELL.getAttribute('data-calc'));
			var cellCalcValue = Number(cell.getAttribute('data-calc'));
			var order = activeCalcValue > cellCalcValue;

			markCellsBetweenClickedCells(
				Math.min(activeCalcValue, cellCalcValue),
				Math.max(activeCalcValue, cellCalcValue)
			);

			START_CELL = order ? cell : ACTIVE_CELL;
			END_CELL = order ? ACTIVE_CELL : cell;
			ACTIVE_CELL = false;

			START_CELL.setAttribute('data-state', 'start');
			END_CELL.setAttribute('data-state', 'end');
		}

		function handleClickOnValidCell ( cell, silent ) {

			if ( ACTIVE_CELL && options.range ) {
				handleEventWithActiveCell(cell);
			} else {
				clearClickedCells();
				cell.setAttribute('data-state', 'pending');
				ACTIVE_CELL = cell;
			}

			if ( !silent ) {
				emitEvent('Select');
			}
		}

		function isValidCellTarget ( target ) {
			if ( !target ) return false;
			if ( !target.hasAttribute('data-date') ) return false;
			if ( target.getAttribute('data-valid') === 'false' ) return false;
			return true;
		}

		function delegatedCellClick ( event ) {

			if ( ACTIVE_CELL && event.target === ACTIVE_CELL ) {
				event.stopPropagation();
				interfaceClear();
			}

			else if ( isValidCellTarget(event.target) ) {
				event.stopPropagation();
				handleClickOnValidCell(event.target);
			}
		}

		function attachNodeEvents ( ) {
			ROOT.addEventListener('click', delegatedCellClick);
		}

		function interfacePrev ( ) {
			if ( !CAN_PREV ) return;
			CURRENT.addMonths(-1);
			generateCalendarForCurrent();
			emitEvent('Select');
		}

		function interfaceNext ( ) {
			if ( !CAN_NEXT ) return;
			CURRENT.addMonths(1);
			generateCalendarForCurrent();
			emitEvent('Select');
		}

		function interfaceGet ( ) {

			var s = getDateFromCell(START_CELL);
			var e = getDateFromCell(END_CELL);
			var nights = false;

			if ( s && e ) {
				nights = Math.round((e - s) / 86400000);
			}

			return {
				start: s || getDateFromCell(ACTIVE_CELL),
				end: e,
				nights: nights,
				days: nights ? nights + 1 : false
			};
		}

		function interfaceSet ( dt ) {

			if ( !isValidDate(dt) || dt < START || dt > END ) {
				throw new Error('date not valid (' + dt + ')');
			}

			interfaceClear(true);
			
			if ( options.twoCalendars && isSameMonth(dt, END) ) {
				dt.addMonths(-1);
			}

			CURRENT = dt.null();

			generateCalendarForCurrent();
		}

		function interfaceSelect ( dtStart, dtEnd ) {

			interfaceSet(copy(dtStart));

			handleClickOnValidCell(getCellForDate(dtStart), true);

			if ( dtEnd && options.twoCalendars ) {
				handleClickOnValidCell(getCellForDate(dtEnd), true);
			}
		}

		function interfaceClear ( silent ) {
			clearClickedCells();

			if ( !silent ) {
				emitEvent('Clear');
			}
		}

		generateCalendarForCurrent();
		attachNodeEvents();

		var API = {
			prev: interfacePrev,
			next: interfaceNext,
			get: interfaceGet,
			set: interfaceSet,
			select: interfaceSelect,
			clear: interfaceClear,
			tools: {
				copyDate: copy
			},
			id: options.id,
			destroy: function ( ) { ROOT.innerHTML = ''; },
			isTwoCalendars: function ( ) { return !!options.twoCalendars; }
		};

		return API;
	}

	return Picker;

}));
