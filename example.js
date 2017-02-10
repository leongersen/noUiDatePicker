
	Date.prototype.dmY = function() {return ('0'+this.getDate()).slice(-2)+'-'+('0'+(this.getMonth()+1)).slice(-2)+'-'+this.getFullYear(); };

	(function(){

		'use strict';

		// Settings
		var dayNamesShort = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
		var dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
		var monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
		var icon = '<svg viewBox="0 0 512 512"><polygon points="268.395,256 134.559,121.521 206.422,50 411.441,256 206.422,462 134.559,390.477 "/></svg>';
		var commonStart = new Date('2016-11-03');
		var commonEnd = new Date('2017-02-11');

		// Windows that contain the calendars
		var flyout_both = document.getElementById('flyout-both');
		var flyout_arrival = document.getElementById('flyout-arrival');
		var flyout_departure = document.getElementById('flyout-departure');

		var span_startValue = document.getElementById('a');
		var span_endValue = document.getElementById('b');

		var startPickerNode = document.getElementById('date-1');
		var endPickerNode = document.getElementById('date-2');
		var bothPickerNode = document.getElementById('date-3');

		var startPicker;
		var endPicker;
		var bothPicker;

		var startValue = false;
		var endValue = false;
		
		var other = document.getElementById('other');
		
		// This would work based on screen width
		function choose ( ) {
			return !!document.getElementById('on').checked;
		}

		function show ( tgt ) {
			tgt.removeAttribute('data-closed');
			tgt.appendChild(other);
		}
		
		function show1 ( ) {
			show(choose() ? flyout_both : flyout_arrival);
		}

		function show2 ( ) {
			show(choose() ? flyout_both : (startValue ? flyout_departure : flyout_arrival));
		}

		document.getElementById('button1').addEventListener('click', show1);
		document.getElementById('button2').addEventListener('click', show2);

		function setStart ( a ) {
			span_startValue.innerHTML = a ? a.dmY() : 'Aankomstdatum';
			startValue = a;
		}

		function setEnd ( a ) {
			span_endValue.innerHTML = a ? a.dmY() : 'Vertrekdatum';
			endValue = a;
		}

		function onSelectHandler ( ) {

			var value = this.get();
			var selectionIsComplete = this.isTwoCalendars() ? !!value.nights : !!value.start;

			console.log(selectionIsComplete, value, this.id);
			
			if ( this.id == 'start' ) {

				setStart(value.start);

				if ( selectionIsComplete ) {
					buildEndPicker(startPicker.tools.copyDate(value.start).addDays(1));
					flyout_arrival.setAttribute('data-closed', true);
				}
			}

			if ( this.id == 'end' ) {

				setEnd(value.start);

				if ( selectionIsComplete ) {
					flyout_departure.setAttribute('data-closed', true);
				}
			}

			if ( this.id == 'both' ) {

				setStart(value.start);
				setEnd(value.end);

				if ( selectionIsComplete ) {
					flyout_both.setAttribute('data-closed', true);
				}
			}

			console.log( startValue ? startValue.dmY() : false, endValue ? endValue.dmY() : false );

			if ( startValue ) startPicker.select(startValue);
			if ( startValue && endPicker && endValue ) endPicker.select(endValue);
			if ( startValue && this.id != 'both' ) bothPicker.select(startValue, endValue);
		}

		function buildStartPicker ( ) {
			
			startPicker = new Picker(startPickerNode, {
				id: 'start',
				start: commonStart,
				end: commonEnd,
				twoCalendars: false,
				dayNamesShort: dayNamesShort,
				dayNames: dayNames,
				monthNames: monthNames,
				icon: icon,
				onSelect: onSelectHandler
			});
		}

		function buildEndPicker ( start ) {
			
			endPicker = new Picker(endPickerNode, {
				id: 'end',
				start: start,
				end: commonEnd,
				twoCalendars: false,
				dayNamesShort: dayNamesShort,
				dayNames: dayNames,
				monthNames: monthNames,
				icon: icon,
				onSelect: onSelectHandler
			});
		}

		function buildBothPicker ( ) {
			
			bothPicker = new Picker(bothPickerNode, {
				id: 'both',
				start: commonStart,
				end: commonEnd,
				range: true,
				twoCalendars: true,
				dayNamesShort: dayNamesShort,
				dayNames: dayNames,
				monthNames: monthNames,
				icon: icon,
				onSelect: onSelectHandler
			});
		}

		buildStartPicker();
		buildBothPicker();
		
	}());
