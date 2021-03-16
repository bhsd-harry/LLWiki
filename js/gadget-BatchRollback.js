/*
    BatchRollback.js
    Made with ♥ by User:Leranjun

    This tool helps administrators quickly rollback vandal edits and delete related revisions.
    Requires rollback right (and optional deleterevision right).
    */
/* global mw, OO */
/* jslint esversion: 8 */
(async () => {
    "use strict";

    // Only if user has rollback right
    if (!(await mw.user.getRights()).includes("rollback")) {
        return;
    }

    // Only load on Special:Contributions
    if (!$("body").hasClass("mw-special-Contributions")) {
        return;
    }

    await mw.loader.using("oojs-ui-core");
    const initButton = new OO.ui.ButtonWidget({
        label: "批量回退",
        flags: ["progressive"],
    });
    $("#mw-content-text").prepend(initButton.$element);

    $(initButton.$element).click(async () => {
        $("#firstHeading").text("批量回退");
        $("#mw-content-text").text("正在加载……");
        await mw.loader.using("mediawiki.api");
        const api = new mw.Api();

        // User interface
        const fieldset = new OO.ui.FieldsetLayout({
            label: "批量回退编辑工具",
            classes: ["container"],
            help: "本工具用于批量回退指定用户编辑，可用于快速处理破坏。仅在用户具有rollback权限时有效。",
            helpInline: true,
        });
        const usernameBox = new OO.ui.TextInputWidget({
                placeholder: "必填",
                value: mw.config.get("wgRelevantUserName"),
                validate: "non-empty",
            }),
            timeBox = new OO.ui.DropdownInputWidget({
                options: [
                    { data: "10min", label: "10分钟" },
                    { data: "30min", label: "30分钟" },
                    { data: "1h", label: "1小时" },
                    { data: "24h", label: "24小时" },
                    { data: "7d", label: "7天" },
                    { data: "10d", label: "10天" },
                    { data: "30d", label: "30天" },
                    // { data: "all", label: "全部" },
                ],
            }),
            reasonBox = new OO.ui.TextInputWidget({
                value: "破坏",
            }),
            suppressBox = new OO.ui.CheckboxInputWidget({
                selected: true,
            }),
            submit = new OO.ui.ButtonInputWidget({
                label: "确认",
                flags: ["primary", "progressive"],
            }),
            dry = new OO.ui.ButtonInputWidget({
                label: "预览",
            }),
            emergency = new OO.ui.ButtonInputWidget({
                label: "紧急停止",
                flags: ["destructive"],
                disabled: true,
            });
        fieldset.addItems([
            new OO.ui.FieldLayout(usernameBox, {
                label: "目标用户名",
                align: "top",
            }),
            new OO.ui.FieldLayout(timeBox, {
                label: "回溯时长",
                align: "top",
            }),
            new OO.ui.FieldLayout(reasonBox, {
                label: "原因",
                align: "top",
            }),
            new OO.ui.FieldLayout(suppressBox, {
                label: "同时删除贡献",
                align: "inline",
                help: "需要deleterevision权限。",
                helpInline: true,
            }),
            new OO.ui.FieldLayout(
                new OO.ui.Widget({
                    content: [
                        new OO.ui.HorizontalLayout({
                            items: [submit, dry, emergency],
                        }),
                    ],
                })
            ),
        ]);
        $("#mw-content-text").html(fieldset.$element);

        // Back button that reloads the page /shrug
        const backButton = new OO.ui.ButtonWidget({
            label: "返回",
            flags: ["progressive"],
        });
        $("#mw-content-text").prepend(backButton.$element);
        $(backButton.$element).click(() => window.location.reload());

        // Emergency stop that also reloads the page
        $(emergency.$element).click(() => window.location.reload());

        // Define logging function
        const log = (message) => {
            $("#rollback-log").append(new Date().toLocaleString() + " - " + message + "<br />");
        };

        // Main code
        const main = (e) => {
            usernameBox
                .getValidity()
                .done(async () => {
                    // Username is valid, disable submit button and enable emergency stop
                    submit.setDisabled(true);
                    dry.setDisabled(true);
                    emergency.setDisabled(false);

                    // Check if log exists
                    if ($("#rollback-log").length) {
                        $("#rollback-log").empty();
                    } else {
                        $("<h2>").text("日志").appendTo("#mw-content-text");
                        $("<div>")
                            .css("background", "#f9f9f9")
                            .css("padding", "1em")
                            .css("border", "thin solid #eaecf0")
                            .attr("id", "rollback-log")
                            .appendTo("#mw-content-text");
                    }

                    // Parameters
                    const target = usernameBox.getValue(),
                        limit = new Date(),
                        reason = "批量回退：" + (reasonBox.getValue() || "破坏"),
                        suppress = suppressBox.isSelected();

                    // Backtrack according to input
                    switch (timeBox.getValue()) {
                        case "10min":
                            limit.setUTCMinutes(limit.getUTCMinutes() - 10);
                            break;
                        case "30min":
                            limit.setUTCMinutes(limit.getUTCMinutes() - 30);
                            break;
                        case "1h":
                            limit.setUTCHours(limit.getUTCHours() - 1);
                            break;
                        case "24h":
                            limit.setUTCDate(limit.getUTCDate() - 1);
                            break;
                        case "7d":
                            limit.setUTCDate(limit.getUTCDate() - 7);
                            break;
                        case "10d":
                            limit.setUTCDate(limit.getUTCDate() - 10);
                            break;
                        case "30d":
                            limit.setUTCDate(limit.getUTCDate() - 30);
                            break;
                        case "all":
                            limit.setTime(0);
                            break;
                        default:
                            throw new Error("回溯时长不合法");
                    }

                    log(
                        "针对 " +
                            target +
                            " 的批量回退" +
                            (e.data.dry ? "预览" : "") +
                            "已开始，回溯至 " +
                            limit.toLocaleString() +
                            " ，" +
                            (suppress ? "同时" : "不") +
                            "删除修订版本"
                    );

                    try {
                        const pages = [], // Set of pages pending rollback
                            ids = []; // Array of ids pending deletion
                        let params = {};

                        // Get target user contribs
                        let more = "|",
                            count = 0;
                        while (more) {
                            params = {
                                action: "query",
                                format: "json",
                                list: "usercontribs",
                                ucuser: target,
                                ucend: limit.toISOString(),
                                uclimit: "max",
                                uccontinue: more,
                            };
                            const data = await api.get(params);
                            if (!data.query.usercontribs.length) {
                                throw new Error("用户不存在或没有符合条件的贡献");
                            }
                            more = data.continue === undefined ? false : data.continue.uccontinue;

                            const uc = data.query.usercontribs;
                            for (let i in uc) {
                                if (typeof uc[i].top !== "undefined") {
                                    // Contrib is latest revision, add page title to pages
                                    pages.push(uc[i].title);
                                }
                            }
                            if (suppress) {
                                for (let i in uc) {
                                    if (pages.includes(uc[i].title)) {
                                        // Target page is in pages, add revision ID to ids
                                        ids.push(uc[i].revid);
                                    }
                                }
                            }
                            count += uc.length;
                            log("已获取 " + count + " 条贡献");
                        }

                        if (!pages.length) {
                            throw new Error("无最新修订版本贡献，无法回退");
                        }

                        log("用户贡献信息获取成功，开始" + (e.data.dry ? "预览" : "") + "回退");
                        // Wait for all rollback operations to finish before deleting revisions,
                        // otherwise revisions will not be deleted
                        await Promise.allSettled(
                            pages.map((cur, i) => {
                                const progress = "[" + String(i + 1) + "/" + pages.length + "] ";
                                if (e.data.dry) {
                                    log(progress + "将回退页面 " + cur);
                                    return Promise.resolve();
                                }
                                params = {
                                    action: "rollback",
                                    title: cur,
                                    user: target,
                                    format: "json",
                                    summary: reason,
                                };
                                return api
                                    .postWithToken("rollback", params)
                                    .done(() => log(progress + "回退页面 " + cur + " 成功"))
                                    .catch((e) => log(progress + "回退页面 " + cur + " 时发生错误：" + e));
                            })
                        );
                        if (suppress) {
                            log((e.data.dry ? "预览" : "") + "回退完成，开始删除修订版本");
                            // Wait for all deletion operations to finish
                            await Promise.allSettled(
                                ids.map((cur, i) => {
                                    const progress = "[" + String(i + 1) + "/" + ids.length + "] ";
                                    if (e.data.dry) {
                                        log(progress + "将删除修订版本 " + cur);
                                        return Promise.resolve();
                                    }
                                    params = {
                                        action: "revisiondelete",
                                        type: "revision",
                                        ids: cur,
                                        format: "json",
                                        hide: "content|comment|user",
                                        reason: reason,
                                    };
                                    return api
                                        .postWithToken("csrf", params)
                                        .done(() => log(progress + "删除修订版本 " + cur + " 成功"))
                                        .catch((e) => log(progress + "删除修订版本 " + cur + " 时发生错误：" + e));
                                })
                            );
                        }
                        log((e.data.dry ? "预览" : "") + "批量回退完成");
                    } catch (e) {
                        log(e);
                    }

                    // Reset submit and emergency stop buttons
                    submit.setDisabled(false);
                    dry.setDisabled(false);
                    emergency.setDisabled(true);
                })
                .catch(() => usernameBox.setValidityFlag(false)); // Username is invalid
        };

        // Bind to click events
        $(submit.$element).click({}, main);
        $(dry.$element).click({ dry: true }, main);
    });
})();
