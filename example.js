
	(function(){

		'use strict';

		var dayNamesShort = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
		var monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
		var icon = '<svg viewBox="0 0 512 512"><polygon points="268.395,256 134.559,121.521 206.422,50 411.441,256 206.422,462 134.559,390.477 "/></svg>';

		var root = document.getElementById('picker');
		var dateInput = document.getElementById('date');
		var altInput = document.getElementById('alt');
		var doc = document.documentElement;

		function format ( dt ) {
			return Picker.prototype.pad(dt.getDate()) + ' ' + monthNames[dt.getMonth()].slice(0,3) + ' ' + dt.getFullYear();
		}

		function show ( ) {
			root.removeAttribute('hidden');
		}

		function hide ( ) {
			root.setAttribute('hidden', '');
			doc.removeEventListener('click', hide);
		}

		function onSelectHandler ( ) {

			var value = this.get();

			if ( value.start ) {
				dateInput.value = value.start.Ymd();
				altInput.value = format(value.start);
				hide();
			}
		}

		var picker = new Picker(root, {
			min: new Date(dateInput.min),
			max: new Date(dateInput.max),
			icon: icon,
			twoCalendars: false,
			dayNamesShort: dayNamesShort,
			monthNames: monthNames,
			onSelect: onSelectHandler
		});

		root.parentElement.addEventListener('click', function ( e ) { e.stopPropagation(); });

		dateInput.addEventListener('change', function ( ) {

			if ( dateInput.value ) {
				picker.select(new Date(dateInput.value));
			} else {
				picker.clear();
			}
		});

		altInput.addEventListener('focus', function ( ) {
			altInput.blur();
			show();
			doc.addEventListener('click', hide, false);
		});

	}());
