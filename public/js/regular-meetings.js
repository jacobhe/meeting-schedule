/*jslint vars: true, nomen: true */
/*global window, document, $, EJS, login_user, alert */

$(function () {

    'use strict';

    var submiting = false;

    var onOK = function () {
        if (submiting) {
            return;
        }
        $(this).find('.form-horizontal').submit();
    };

    var onCancel = function () {
        $(this).dialog('close');
    };

    var onClose = function () {
        var dialog = $(this);
        dialog.removeData('_id');
        dialog.find('[id="startTime"]').val('');
        dialog.find('[id="endTime"]').val('');
        dialog.find('[id="meetingRoom"]').val('');
        dialog.find('[id="title"]').val('');
        dialog.find('[id="department"]').val('');
        dialog.find('[id="username"]').val('');
        dialog.find('[id="phone"]').val('');
        dialog.find('[id="equipmentList"]').text('');
    };

    var onCreate = function (e) {
        var dialog = $(this);

        dialog.find('.form-horizontal').validate({
            errorPlacement: function (error, element) {
                error.appendTo(element.next("span.help-inline"));
                element.parents('.control-group').addClass('error');
            },
            success: function (label) {
                label.parents('.control-group').removeClass('error');
                label.remove();
            },
            rules: {
                meetingRoom: 'required',
                title: 'required',
                department: 'required',
                username: 'required',
                phone: 'required',
                startDate: 'required',
                endDate: 'required'
            },
            submitHandler: function (form) {
                var start = dialog.find('[id="startTime"]').val();
                var end = dialog.find('[id="endTime"]').val();
                var where = dialog.find('[id="meetingRoom"]').val();
                var what = dialog.find('[id="title"]').val();
                var department = dialog.find('[id="department"]').val();
                var name = dialog.find('[id="username"]').val();
                var phone = dialog.find('[id="phone"]').val();
                var start_date = dialog.find('[id="startDate"]').val();
                var end_date = dialog.find('[id="endDate"]').val();
                var frequency = dialog.find('[id="frequency"]').val();
                var _id = dialog.data('_id');
                var equipments = dialog.find('[id="equipmentList"]').text().split(', ');
                var password = Math.floor(Math.random() * 10000);
                var monthly_checkbox = [];
                var weekly_checkbox = [];
                var days;
                var weeknum = dialog.find('[id="select_week"]').val();

                dialog.find('#div_select_week input[type=checkbox]:checked').each(function (i, cb) {
                    monthly_checkbox.push(parseInt($(cb).val(), 10));
                });
                dialog.find('#div_select_days input[type=checkbox]:checked').each(function (i, cb) {
                    weekly_checkbox.push(parseInt($(cb).val(), 10));
                });

                if (end_date < start_date) {
                    alert('结束日期必须大于等于开始日期');
                    return;
                }
                if (frequency === 'monthly') {
                    if (!monthly_checkbox.length) {
                        alert('请选择具体每一周的星期几');
                        return;
                    }
                    days = monthly_checkbox;
                } else {
                    if (!weekly_checkbox.length) {
                        alert('请选择具体每一周的星期几');
                        return;
                    }
                    days = weekly_checkbox;
                }

                var meeting = {
                    '_id': _id,
                    'title': $.trim(what),
                    'startTime': start,
                    'endTime': end,
                    'department': $.trim(department),
                    'name': $.trim(name),
                    'phone': $.trim(phone),
                    'room': where,
                    'startDate': start_date || $.datepicker.formatDate('yy-mm-dd', new Date()),
                    'endDate': end_date || $.datepicker.formatDate('yy-mm-dd', new Date()),
                    'frequency': frequency,
                    'days': days,
                    'weeknum': weeknum,
                    'equipments': equipments
                };
                $.ajax({
                    url: _id ? './update' : './insert',
                    success: function (data) {
                        if (data.error) {
                            alert(data.message);
                        }
                        window.location.reload();
                    },
                    complete: function () {
                        submiting = false;
                    },
                    data: JSON.stringify(meeting)
                });
            }
        });
        var onEquimentDlgOK = function (e) {
            var eq_dialog = $(this);
            var equipments = [];
            eq_dialog.find('.ck-equipments:checked').each(function (i, ck) {
                equipments.push($(ck).val());
            });
            eq_dialog.trigger('select-equipment', {equipments: equipments});
            eq_dialog.dialog('close');
        };

        var onEquimentDlgCancel = function (e) {
            $(this).dialog('close');
        };

        var onEquimentDlgClose = function (e) {
            $(this).find('.ck-equipments').each(function (i, ck) {
                $(ck).attr('checked', false).attr('disabled', false);
            });
        };

        var equipment_dialog = $('#equipment-dialog')
            .append(new EJS({ url: '/templates/select-equipment-dialog.ejs' }).render())
            .dialog({
                title: '选择设备',
                modal: true,
                autoOpen: false,
                close: onEquimentDlgClose,
                width: 400,
                buttons: [
                    {
                        text: "确定",
                        click: onEquimentDlgOK
                    },
                    {
                        text: "取消",
                        click: onEquimentDlgCancel
                    }
                ]
            });

        equipment_dialog.on('select-equipment', function (e, data) {
            dialog.find('[id="equipmentList"]').text(data.equipments.join(', '));
        });

        dialog.find('[id="meetingRoom"]').change(function (e) {
            e.preventDefault();
            dialog.find('[id="equipmentList"]').text('');
        });

        dialog.find('[id="frequency"]').change(function () {
            e.preventDefault();
            var value = $(this).val();
            if (value === 'monthly') {
                dialog.find('#div_select_days').hide();
                dialog.find('#div_select_week').show();
            } else {
                dialog.find('#div_select_days').show();
                dialog.find('#div_select_week').hide();
            }
        });

        dialog.find('[id=":w.equipment"]').click(function (e) {
            e.preventDefault();
            var where = dialog.find('[id="meetingRoom"]').val();

            equipment_dialog.find('.ck-equipments').each(function (i, ck) {
                ck = $(ck);
                if (ck.attr('rooms').indexOf(where) === -1) {
                    ck.attr('disabled', true);
                }
            });

            equipment_dialog.dialog('open');
        });

        $(".select-date").datepicker({
            dateFormat: 'yy-mm-dd'
        });
    };

    var regular_meeting_dialog = $('#regular-meeting-dialog')
        .append(new EJS({ url: '/templates/regular-meeting-dialog.ejs' }).render())
        .dialog({
            autoOpen: false,
            modal: true,
            create: onCreate,
            close: onClose,
            width: 600,
            buttons: [
                {
                    text: "确定",
                    click: onOK
                },
                {
                    text: "取消",
                    click: onCancel
                }
            ]
        });

    $('#add-regular-meeting').click(function (e) {
        e.preventDefault();
        regular_meeting_dialog.dialog('option', { title: '添加常规会议' });
        regular_meeting_dialog.dialog('open');
    });

    function setDialogData(tr, dialog) {
        var tds = tr.find('td');
        var i;
        var j;
        for (i = 0; i < tds.length; i += 1) {
            tds[i] = $(tds[i]);
        }
        var times = $.trim(tds[3].text());
        var date = $.trim(tds[1].text());
        var display_label = $.trim(tds[2].text());
        var room = $.trim(tds[4].text());
        var title = $.trim(tds[5].text());
        var department = $.trim(tds[6].text());
        var name = $.trim(tds[7].text());
        var phone = $.trim(tds[8].text());
        var equipments = $.trim(tds[9].text());
        var times_arr = times.split('~');
        var start = $.trim(times_arr[0]);
        var end = $.trim(times_arr[1]);
        var date_arr = date.split('~');
        var start_date = $.trim(date_arr[0]);
        var end_date = $.trim(date_arr[1]);
        var display_label_arr = display_label.split(/\s+/);
        var frequency = display_label_arr[0] === '每月' ? 'monthly' : 'weekly';
        var days = [];
        for (i = 1; i < display_label_arr.length; i += 1) {
            switch (display_label_arr[i]) {
            case '星期天':
                days.push('0');
                break;
            case '星期一':
                days.push('1');
                break;
            case '星期二':
                days.push('2');
                break;
            case '星期三':
                days.push('3');
                break;
            case '星期四':
                days.push('4');
                break;
            case '星期五':
                days.push('5');
                break;
            case '星期六':
                days.push('6');
                break;
            }
        }

        dialog.find('[id="startDate"]').val(start_date).next().val(start_date);
        dialog.find('[id="endDate"]').val(end_date).next().val(end_date);
        dialog.find('[id="startTime"]').val(start);
        dialog.find('[id="endTime"]').val(end);
        dialog.find('[id="meetingRoom"]').val(room);
        dialog.find('[id="title"]').val(title);
        dialog.find('[id="department"]').val(department);
        dialog.find('[id="username"]').val(name);
        dialog.find('[id="phone"]').val(phone);
        dialog.find('[id="equipmentList"]').text('');
        dialog.find('[id="frequency"]').val(frequency);
        if (frequency === 'monthly') {
            dialog.find('#div_select_days').hide();
            dialog.find('#div_select_week').show();
            dialog.find('#div_select_week input[type=checkbox]').each(function (i, cb) {
                cb = $(cb);
                cb.attr('checked', false);
                for (j = 0; j < days.length; j += 1) {
                    if (cb.val() === days[j]) {
                        cb.attr('checked', true);
                        break;
                    }
                }
            });
        } else {
            dialog.find('#div_select_days').show();
            dialog.find('#div_select_week').hide();
            dialog.find('#div_select_days input[type=checkbox]').each(function (i, cb) {
                cb = $(cb);
                cb.attr('checked', false);
                for (j = 0; j < days.length; j += 1) {
                    if (cb.val() === days[j]) {
                        cb.attr('checked', true);
                        break;
                    }
                }
            });
        }
        dialog.find('[id="equipmentList"]').text(equipments);
    }

    $('.edit-regular-meeting').click(function (e) {
        e.preventDefault();
        var tr = $(this).parents('.tb-list');
        setDialogData(tr, regular_meeting_dialog);
        regular_meeting_dialog.data('_id', $(this).attr('_id'));
        regular_meeting_dialog.dialog('option', {title: '修改常规会议'});
        regular_meeting_dialog.dialog('open');
    });

    $('.copy-regular-meeting').click(function (e) {
        e.preventDefault();
        var tr = $(this).parents('.tb-list');
        setDialogData(tr, regular_meeting_dialog);
        regular_meeting_dialog.dialog('option', { title: '复制常规会议' });
        regular_meeting_dialog.dialog('open');
    });

    $('.delete-regular-meeting').click(function (e) {
        e.preventDefault();
        if (window.confirm('确定删除这个常规会议？')) {
            $.ajax({
                url: './delete',
                success: function (data) {
                    if (data.error) {
                        alert(data.message);
                    } else {
                        window.location.reload();
                    }
                },
                data: JSON.stringify({ _id: $(this).attr('_id') })
            });
        }
    });
});