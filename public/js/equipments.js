/*jslint vars: true, nomen: true */
/*global window, document, $, EJS, login_user, alert */

$(function () {
    'use strict';

    var submiting = false;
    var onOK = function () {
        if (submiting) {
            return;
        }
        var dialog = $(this);
        var name = dialog.find('#name').val();
        var meeting_rooms = [];
        dialog.find('.ck-meeting-rooms:checked').each(function (i, ck) {
            meeting_rooms.push($(ck).val());
        });
        if ($.trim(name) === '') {
            return alert('请填写设备名称');
        }
        if (!meeting_rooms.length) {
            return alert('请选择可以使用的会议室');
        }
        $.ajax({
            url: './insert',
            success: function (data) {
                if (data.error) {
                    alert('添加设备出错');
                } else {
                    window.location.reload();
                }
            },
            complete: function () {
                submiting = false;
            },
            data: JSON.stringify({ name: name, meeting_rooms: meeting_rooms })
        });
    };

    var onCancel = function () {
        $(this).dialog('close');
    };

    var onClose = function () {
        var dialog = $(this);
        dialog.find('#name').val('');
        dialog.find('.ck-meeting-rooms:checked').each(function (i, ck) {
            $(ck).attr('checked', false);
        });
    };

    var equipment_dialog = $('#equipment-dialog')
        .append(new EJS({ url: '/templates/equipment-dialog.ejs' }).render())
        .dialog({
            title: '添加设备',
            modal: true,
            autoOpen: false,
            close: onClose,
            width: 400,
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

    $('#add-equipment').click(function (e) {
        e.preventDefault();
        equipment_dialog.dialog('open');
    });

    $('.delete-equipment').click(function (e) {
        e.preventDefault();
        $.ajax({
            url: './delete',
            success: function (data) {
                if (data.error) {
                    alert('删除设备出错');
                } else {
                    window.location.reload();
                }
            },
            data: JSON.stringify({ _id: $(this).attr('id') })
        });
    });
});