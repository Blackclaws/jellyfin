define(["itemHelper", "dom", "layoutManager", "dialogHelper", "datetime", "loading", "focusManager", "connectionManager", "globalize", "require", "shell", "emby-checkbox", "emby-input", "emby-select", "listViewStyle", "emby-textarea", "emby-button", "paper-icon-button-light", "css!./../formdialog", "clearButtonStyle", "flexStyles"], function(itemHelper, dom, layoutManager, dialogHelper, datetime, loading, focusManager, connectionManager, globalize, require, shell) {
    "use strict";

    function isDialog() {
        return currentContext.classList.contains("dialog")
    }

    function closeDialog(isSubmitted) {
        isDialog() && dialogHelper.close(currentContext)
    }

    function submitUpdatedItem(form, item) {
        function afterContentTypeUpdated() {
            require(["toast"], function(toast) {
                toast(globalize.translate("sharedcomponents#MessageItemSaved"))
            }), loading.hide(), closeDialog(!0)
        }
        var apiClient = getApiClient();
        apiClient.updateItem(item).then(function() {
            var newContentType = form.querySelector("#selectContentType").value || "";
            (metadataEditorInfo.ContentType || "") !== newContentType ? apiClient.ajax({
                url: apiClient.getUrl("Items/" + item.Id + "/ContentType", {
                    ContentType: newContentType
                }),
                type: "POST"
            }).then(function() {
                afterContentTypeUpdated()
            }) : afterContentTypeUpdated()
        })
    }

    function getSelectedAirDays(form) {
        var checkedItems = form.querySelectorAll(".chkAirDay:checked") || [];
        return Array.prototype.map.call(checkedItems, function(c) {
            return c.getAttribute("data-day")
        })
    }

    function getAlbumArtists(form) {
        return form.querySelector("#txtAlbumArtist").value.trim().split(";").filter(function(s) {
            return s.length > 0
        }).map(function(a) {
            return {
                Name: a
            }
        })
    }

    function getArtists(form) {
        return form.querySelector("#txtArtist").value.trim().split(";").filter(function(s) {
            return s.length > 0
        }).map(function(a) {
            return {
                Name: a
            }
        })
    }

    function getDateValue(form, element, property) {
        var val = form.querySelector(element).value;
        if (!val) return null;
        if (currentItem[property]) {
            var date = datetime.parseISO8601Date(currentItem[property], !0),
                parts = date.toISOString().split("T");
            if (0 === parts[0].indexOf(val)) {
                val += "T" + parts[1]
            }
        }
        return val
    }

    function onSubmit(e) {
        loading.show();
        var form = this,
            item = {
                Id: currentItem.Id,
                Name: form.querySelector("#txtName").value,
                OriginalTitle: form.querySelector("#txtOriginalName").value,
                ForcedSortName: form.querySelector("#txtSortName").value,
                CommunityRating: form.querySelector("#txtCommunityRating").value,
                CriticRating: form.querySelector("#txtCriticRating").value,
                IndexNumber: form.querySelector("#txtIndexNumber").value || null,
                AirsBeforeSeasonNumber: form.querySelector("#txtAirsBeforeSeason").value,
                AirsAfterSeasonNumber: form.querySelector("#txtAirsAfterSeason").value,
                AirsBeforeEpisodeNumber: form.querySelector("#txtAirsBeforeEpisode").value,
                ParentIndexNumber: form.querySelector("#txtParentIndexNumber").value || null,
                DisplayOrder: form.querySelector("#selectDisplayOrder").value,
                Album: form.querySelector("#txtAlbum").value,
                AlbumArtists: getAlbumArtists(form),
                ArtistItems: getArtists(form),
                Overview: form.querySelector("#txtOverview").value,
                Status: form.querySelector("#selectStatus").value,
                AirDays: getSelectedAirDays(form),
                AirTime: form.querySelector("#txtAirTime").value,
                Genres: getListValues(form.querySelector("#listGenres")),
                Tags: getListValues(form.querySelector("#listTags")),
                Studios: getListValues(form.querySelector("#listStudios")).map(function(element) {
                    return {
                        Name: element
                    }
                }),
                PremiereDate: getDateValue(form, "#txtPremiereDate", "PremiereDate"),
                DateCreated: getDateValue(form, "#txtDateAdded", "DateCreated"),
                EndDate: getDateValue(form, "#txtEndDate", "EndDate"),
                ProductionYear: form.querySelector("#txtProductionYear").value,
                AspectRatio: form.querySelector("#txtOriginalAspectRatio").value,
                Video3DFormat: form.querySelector("#select3dFormat").value,
                OfficialRating: form.querySelector("#selectOfficialRating").value,
                CustomRating: form.querySelector("#selectCustomRating").value,
                People: currentItem.People,
                LockData: form.querySelector("#chkLockData").checked,
                LockedFields: Array.prototype.filter.call(form.querySelectorAll(".selectLockedField"), function(c) {
                    return !c.checked
                }).map(function(c) {
                    return c.getAttribute("data-value")
                })
            };
        item.ProviderIds = Object.assign({}, currentItem.ProviderIds);
        var idElements = form.querySelectorAll(".txtExternalId");
        if (Array.prototype.map.call(idElements, function(idElem) {
                var providerKey = idElem.getAttribute("data-providerkey");
                item.ProviderIds[providerKey] = idElem.value
            }), item.PreferredMetadataLanguage = form.querySelector("#selectLanguage").value, item.PreferredMetadataCountryCode = form.querySelector("#selectCountry").value, "Person" === currentItem.Type) {
            var placeOfBirth = form.querySelector("#txtPlaceOfBirth").value;
            item.ProductionLocations = placeOfBirth ? [placeOfBirth] : []
        }
        if ("Series" === currentItem.Type) {
            var seriesRuntime = form.querySelector("#txtSeriesRuntime").value;
            item.RunTimeTicks = seriesRuntime ? 6e8 * seriesRuntime : null
        }
        var tagline = form.querySelector("#txtTagline").value;
        return item.Taglines = tagline ? [tagline] : [], submitUpdatedItem(form, item), e.preventDefault(), e.stopPropagation(), !1
    }

    function getListValues(list) {
        return Array.prototype.map.call(list.querySelectorAll(".textValue"), function(el) {
            return el.textContent
        })
    }

    function addElementToList(source, sortCallback) {
        require(["prompt"], function(prompt) {
            prompt({
                label: "Value:"
            }).then(function(text) {
                var list = dom.parentWithClass(source, "editableListviewContainer").querySelector(".paperList"),
                    items = getListValues(list);
                items.push(text), populateListView(list, items, sortCallback)
            })
        })
    }

    function removeElementFromList(source) {
        var el = dom.parentWithClass(source, "listItem");
        el.parentNode.removeChild(el)
    }

    function editPerson(context, person, index) {
        require(["personEditor"], function(personEditor) {
            personEditor.show(person).then(function(updatedPerson) {
                -1 === index && currentItem.People.push(updatedPerson), populatePeople(context, currentItem.People)
            })
        })
    }

    function showMoreMenu(context, button, user) {
        require(["itemContextMenu"], function(itemContextMenu) {
            var item = currentItem;
            itemContextMenu.show({
                item: item,
                positionTo: button,
                edit: !1,
                editImages: !0,
                editSubtitles: !0,
                sync: !1,
                share: !1,
                play: !1,
                queue: !1,
                user: user
            }).then(function(result) {
                result.deleted ? afterDeleted(context, item) : result.updated && reload(context, item.Id, item.ServerId)
            })
        })
    }

    function afterDeleted(context, item) {
        var parentId = item.ParentId || item.SeasonId || item.SeriesId;
        parentId ? reload(context, parentId, item.ServerId) : require(["appRouter"], function(appRouter) {
            appRouter.goHome()
        })
    }

    function onEditorClick(e) {
        var btnRemoveFromEditorList = dom.parentWithClass(e.target, "btnRemoveFromEditorList");
        if (btnRemoveFromEditorList) return void removeElementFromList(btnRemoveFromEditorList);
        var btnAddTextItem = dom.parentWithClass(e.target, "btnAddTextItem");
        btnAddTextItem && addElementToList(btnAddTextItem)
    }

    function getApiClient() {
        return connectionManager.getApiClient(currentItem.ServerId)
    }

    function init(context, apiClient) {
        context.querySelector(".externalIds").addEventListener("click", function(e) {
            var btnOpenExternalId = dom.parentWithClass(e.target, "btnOpenExternalId");
            if (btnOpenExternalId) {
                var field = context.querySelector("#" + btnOpenExternalId.getAttribute("data-fieldid")),
                    formatString = field.getAttribute("data-formatstring");
                field.value && shell.openUrl(formatString.replace("{0}", field.value))
            }
        }), context.querySelector(".btnCancel").addEventListener("click", function() {
            closeDialog(!1)
        }), context.querySelector(".btnMore").addEventListener("click", function(e) {
            getApiClient().getCurrentUser().then(function(user) {
                showMoreMenu(context, e.target, user)
            })
        }), context.querySelector(".btnHeaderSave").addEventListener("click", function(e) {
            context.querySelector(".btnSave").click()
        }), context.querySelector("#chkLockData").addEventListener("click", function(e) {
            e.target.checked ? hideElement(".providerSettingsContainer") : showElement(".providerSettingsContainer")
        }), context.removeEventListener("click", onEditorClick), context.addEventListener("click", onEditorClick);
        var form = context.querySelector("form");
        form.removeEventListener("submit", onSubmit), form.addEventListener("submit", onSubmit), context.querySelector("#btnAddPerson").addEventListener("click", function(event, data) {
            editPerson(context, {}, -1)
        }), context.querySelector("#peopleList").addEventListener("click", function(e) {
            var index, btnDeletePerson = dom.parentWithClass(e.target, "btnDeletePerson");
            btnDeletePerson && (index = parseInt(btnDeletePerson.getAttribute("data-index")), currentItem.People.splice(index, 1), populatePeople(context, currentItem.People));
            var btnEditPerson = dom.parentWithClass(e.target, "btnEditPerson");
            btnEditPerson && (index = parseInt(btnEditPerson.getAttribute("data-index")), editPerson(context, currentItem.People[index], index))
        })
    }

    function getItem(itemId, serverId) {
        var apiClient = connectionManager.getApiClient(serverId);
        return itemId ? apiClient.getItem(apiClient.getCurrentUserId(), itemId) : apiClient.getRootFolder(apiClient.getCurrentUserId())
    }

    function getEditorConfig(itemId, serverId) {
        var apiClient = connectionManager.getApiClient(serverId);
        return itemId ? apiClient.getJSON(apiClient.getUrl("Items/" + itemId + "/MetadataEditor")) : Promise.resolve({})
    }

    function populateCountries(select, allCountries) {
        var html = "";
        html += "<option value=''></option>";
        for (var i = 0, length = allCountries.length; i < length; i++) {
            var culture = allCountries[i];
            html += "<option value='" + culture.TwoLetterISORegionName + "'>" + culture.DisplayName + "</option>"
        }
        select.innerHTML = html
    }

    function populateLanguages(select, languages) {
        var html = "";
        html += "<option value=''></option>";
        for (var i = 0, length = languages.length; i < length; i++) {
            var culture = languages[i];
            html += "<option value='" + culture.TwoLetterISOLanguageName + "'>" + culture.DisplayName + "</option>"
        }
        select.innerHTML = html
    }

    function renderContentTypeOptions(context, metadataInfo) {
        metadataInfo.ContentTypeOptions.length ? showElement("#fldContentType", context) : hideElement("#fldContentType", context);
        var html = metadataInfo.ContentTypeOptions.map(function(i) {
                return '<option value="' + i.Value + '">' + i.Name + "</option>"
            }).join(""),
            selectEl = context.querySelector("#selectContentType");
        selectEl.innerHTML = html, selectEl.value = metadataInfo.ContentType || ""
    }

    function loadExternalIds(context, item, externalIds) {
        for (var html = "", providerIds = item.ProviderIds || {}, i = 0, length = externalIds.length; i < length; i++) {
            var idInfo = externalIds[i],
                id = "txt1" + idInfo.Key,
                formatString = idInfo.UrlFormatString || "",
                labelText = globalize.translate("sharedcomponents#LabelDynamicExternalId").replace("{0}", idInfo.Name);
            html += '<div class="inputContainer">', html += '<div class="flex align-items-center">';
            var value = providerIds[idInfo.Key] || "";
            html += '<div class="flex-grow">', html += '<input is="emby-input" class="txtExternalId" value="' + value + '" data-providerkey="' + idInfo.Key + '" data-formatstring="' + formatString + '" id="' + id + '" label="' + labelText + '"/>', html += "</div>", formatString && (html += '<button type="button" is="paper-icon-button-light" class="btnOpenExternalId align-self-flex-end" data-fieldid="' + id + '"><i class="md-icon">open_in_browser</i></button>'), html += "</div>", html += "</div>"
        }
        context.querySelector(".externalIds", context).innerHTML = html, externalIds.length ? context.querySelector(".externalIdsSection").classList.remove("hide") : context.querySelector(".externalIdsSection").classList.add("hide")
    }

    function hideElement(selector, context, multiple) {
        if (context = context || document, "string" == typeof selector) {
            var elements = multiple ? context.querySelectorAll(selector) : [context.querySelector(selector)];
            Array.prototype.forEach.call(elements, function(el) {
                el && el.classList.add("hide")
            })
        } else selector.classList.add("hide")
    }

    function showElement(selector, context, multiple) {
        if (context = context || document, "string" == typeof selector) {
            var elements = multiple ? context.querySelectorAll(selector) : [context.querySelector(selector)];
            Array.prototype.forEach.call(elements, function(el) {
                el && el.classList.remove("hide")
            })
        } else selector.classList.remove("hide")
    }

    function setFieldVisibilities(context, item) {
        item.Path && !1 !== item.EnableMediaSourceDisplay ? showElement("#fldPath", context) : hideElement("#fldPath", context), "Series" === item.Type || "Movie" === item.Type || "Trailer" === item.Type ? showElement("#fldOriginalName", context) : hideElement("#fldOriginalName", context), "Series" === item.Type ? showElement("#fldSeriesRuntime", context) : hideElement("#fldSeriesRuntime", context), "Series" === item.Type || "Person" === item.Type ? showElement("#fldEndDate", context) : hideElement("#fldEndDate", context), "MusicAlbum" === item.Type ? showElement("#albumAssociationMessage", context) : hideElement("#albumAssociationMessage", context), "Movie" === item.Type || "Trailer" === item.Type ? showElement("#fldCriticRating", context) : hideElement("#fldCriticRating", context), "Series" === item.Type ? (showElement("#fldStatus", context), showElement("#fldAirDays", context), showElement("#fldAirTime", context)) : (hideElement("#fldStatus", context), hideElement("#fldAirDays", context), hideElement("#fldAirTime", context)), "Video" === item.MediaType && "TvChannel" !== item.Type ? showElement("#fld3dFormat", context) : hideElement("#fld3dFormat", context), "Audio" === item.Type ? showElement("#fldAlbumArtist", context) : hideElement("#fldAlbumArtist", context), "Audio" === item.Type || "MusicVideo" === item.Type ? (showElement("#fldArtist", context), showElement("#fldAlbum", context)) : (hideElement("#fldArtist", context), hideElement("#fldAlbum", context)), "Episode" === item.Type && 0 === item.ParentIndexNumber ? showElement("#collapsibleSpecialEpisodeInfo", context) : hideElement("#collapsibleSpecialEpisodeInfo", context), "Person" === item.Type || "Genre" === item.Type || "Studio" === item.Type || "GameGenre" === item.Type || "MusicGenre" === item.Type || "TvChannel" === item.Type || "Book" === item.Type ? hideElement("#peopleCollapsible", context) : showElement("#peopleCollapsible", context), "Person" === item.Type || "Genre" === item.Type || "Studio" === item.Type || "GameGenre" === item.Type || "MusicGenre" === item.Type || "TvChannel" === item.Type ? (hideElement("#fldCommunityRating", context), hideElement("#genresCollapsible", context), hideElement("#studiosCollapsible", context), "TvChannel" === item.Type ? showElement("#fldOfficialRating", context) : hideElement("#fldOfficialRating", context), hideElement("#fldCustomRating", context)) : (showElement("#fldCommunityRating", context), showElement("#genresCollapsible", context), showElement("#studiosCollapsible", context), showElement("#fldOfficialRating", context), showElement("#fldCustomRating", context)), showElement("#tagsCollapsible", context), "TvChannel" === item.Type ? (hideElement("#metadataSettingsCollapsible", context), hideElement("#fldPremiereDate", context), hideElement("#fldDateAdded", context), hideElement("#fldYear", context)) : (showElement("#metadataSettingsCollapsible", context), showElement("#fldPremiereDate", context), showElement("#fldDateAdded", context), showElement("#fldYear", context)), "TvChannel" === item.Type ? hideElement(".overviewContainer", context) : showElement(".overviewContainer", context), "Person" === item.Type ? (context.querySelector("#txtProductionYear").label(globalize.translate("sharedcomponents#LabelBirthYear")), context.querySelector("#txtPremiereDate").label(globalize.translate("sharedcomponents#LabelBirthDate")), context.querySelector("#txtEndDate").label(globalize.translate("sharedcomponents#LabelDeathDate")), showElement("#fldPlaceOfBirth")) : (context.querySelector("#txtProductionYear").label(globalize.translate("sharedcomponents#LabelYear")), context.querySelector("#txtPremiereDate").label(globalize.translate("sharedcomponents#LabelReleaseDate")), context.querySelector("#txtEndDate").label(globalize.translate("sharedcomponents#LabelEndDate")), hideElement("#fldPlaceOfBirth")), "Video" === item.MediaType && "TvChannel" !== item.Type ? showElement("#fldOriginalAspectRatio") : hideElement("#fldOriginalAspectRatio"), "Audio" === item.Type || "Episode" === item.Type || "Season" === item.Type ? (showElement("#fldIndexNumber"), "Episode" === item.Type ? context.querySelector("#txtIndexNumber").label(globalize.translate("sharedcomponents#LabelEpisodeNumber")) : "Season" === item.Type ? context.querySelector("#txtIndexNumber").label(globalize.translate("sharedcomponents#LabelSeasonNumber")) : "Audio" === item.Type ? context.querySelector("#txtIndexNumber").label(globalize.translate("sharedcomponents#LabelTrackNumber")) : context.querySelector("#txtIndexNumber").label(globalize.translate("sharedcomponents#LabelNumber"))) : hideElement("#fldIndexNumber"), "Audio" === item.Type || "Episode" === item.Type ? (showElement("#fldParentIndexNumber"), "Episode" === item.Type ? context.querySelector("#txtParentIndexNumber").label(globalize.translate("sharedcomponents#LabelSeasonNumber")) : "Audio" === item.Type ? context.querySelector("#txtParentIndexNumber").label(globalize.translate("sharedcomponents#LabelDiscNumber")) : context.querySelector("#txtParentIndexNumber").label(globalize.translate("sharedcomponents#LabelParentNumber"))) : hideElement("#fldParentIndexNumber", context), "BoxSet" === item.Type ? (showElement("#fldDisplayOrder", context), hideElement(".seriesDisplayOrderDescription", context), context.querySelector("#selectDisplayOrder").innerHTML = '<option value="SortName">' + globalize.translate("sharedcomponents#SortName") + '</option><option value="PremiereDate">' + globalize.translate("sharedcomponents#ReleaseDate") + "</option>") : "Series" === item.Type ? (showElement("#fldDisplayOrder", context), showElement(".seriesDisplayOrderDescription", context), context.querySelector("#selectDisplayOrder").innerHTML = '<option value="">' + globalize.translate("sharedcomponents#Aired") + '</option><option value="absolute">' + globalize.translate("sharedcomponents#Absolute") + '</option><option value="dvd">Dvd</option>') : (context.querySelector("#selectDisplayOrder").innerHTML = "", hideElement("#fldDisplayOrder", context))
    }

    function fillItemInfo(context, item, parentalRatingOptions) {
        var select = context.querySelector("#selectOfficialRating");
        populateRatings(parentalRatingOptions, select, item.OfficialRating), select.value = item.OfficialRating || "", select = context.querySelector("#selectCustomRating"), populateRatings(parentalRatingOptions, select, item.CustomRating), select.value = item.CustomRating || "";
        var selectStatus = context.querySelector("#selectStatus");
        populateStatus(selectStatus), selectStatus.value = item.Status || "", context.querySelector("#select3dFormat", context).value = item.Video3DFormat || "", Array.prototype.forEach.call(context.querySelectorAll(".chkAirDay", context), function(el) {
            el.checked = -1 !== (item.AirDays || []).indexOf(el.getAttribute("data-day"))
        }), populateListView(context.querySelector("#listGenres"), item.Genres), populatePeople(context, item.People || []), populateListView(context.querySelector("#listStudios"), (item.Studios || []).map(function(element) {
            return element.Name || ""
        })), populateListView(context.querySelector("#listTags"), item.Tags);
        var lockData = item.LockData || !1,
            chkLockData = context.querySelector("#chkLockData");
        chkLockData.checked = lockData, chkLockData.checked ? hideElement(".providerSettingsContainer", context) : showElement(".providerSettingsContainer", context), fillMetadataSettings(context, item, item.LockedFields), context.querySelector("#txtPath").value = item.Path || "", context.querySelector("#txtName").value = item.Name || "", context.querySelector("#txtOriginalName").value = item.OriginalTitle || "", context.querySelector("#txtOverview").value = item.Overview || "", context.querySelector("#txtTagline").value = item.Taglines && item.Taglines.length ? item.Taglines[0] : "", context.querySelector("#txtSortName").value = item.ForcedSortName || "", context.querySelector("#txtCommunityRating").value = item.CommunityRating || "", context.querySelector("#txtCriticRating").value = item.CriticRating || "", context.querySelector("#txtIndexNumber").value = null == item.IndexNumber ? "" : item.IndexNumber, context.querySelector("#txtParentIndexNumber").value = null == item.ParentIndexNumber ? "" : item.ParentIndexNumber, context.querySelector("#txtAirsBeforeSeason").value = "AirsBeforeSeasonNumber" in item ? item.AirsBeforeSeasonNumber : "", context.querySelector("#txtAirsAfterSeason").value = "AirsAfterSeasonNumber" in item ? item.AirsAfterSeasonNumber : "", context.querySelector("#txtAirsBeforeEpisode").value = "AirsBeforeEpisodeNumber" in item ? item.AirsBeforeEpisodeNumber : "", context.querySelector("#txtAlbum").value = item.Album || "", context.querySelector("#txtAlbumArtist").value = (item.AlbumArtists || []).map(function(a) {
            return a.Name
        }).join(";"), item.Type, context.querySelector("#selectDisplayOrder").value = item.DisplayOrder || "", context.querySelector("#txtArtist").value = (item.ArtistItems || []).map(function(a) {
            return a.Name
        }).join(";");
        var date;
        if (item.DateCreated) try {
            date = datetime.parseISO8601Date(item.DateCreated, !0), context.querySelector("#txtDateAdded").value = date.toISOString().slice(0, 10)
        } catch (e) {
            context.querySelector("#txtDateAdded").value = ""
        } else context.querySelector("#txtDateAdded").value = "";
        if (item.PremiereDate) try {
            date = datetime.parseISO8601Date(item.PremiereDate, !0), context.querySelector("#txtPremiereDate").value = date.toISOString().slice(0, 10)
        } catch (e) {
            context.querySelector("#txtPremiereDate").value = ""
        } else context.querySelector("#txtPremiereDate").value = "";
        if (item.EndDate) try {
            date = datetime.parseISO8601Date(item.EndDate, !0), context.querySelector("#txtEndDate").value = date.toISOString().slice(0, 10)
        } catch (e) {
            context.querySelector("#txtEndDate").value = ""
        } else context.querySelector("#txtEndDate").value = "";
        context.querySelector("#txtProductionYear").value = item.ProductionYear || "", context.querySelector("#txtAirTime").value = item.AirTime || "";
        var placeofBirth = item.ProductionLocations && item.ProductionLocations.length ? item.ProductionLocations[0] : "";
        if (context.querySelector("#txtPlaceOfBirth").value = placeofBirth, context.querySelector("#txtOriginalAspectRatio").value = item.AspectRatio || "", context.querySelector("#selectLanguage").value = item.PreferredMetadataLanguage || "", context.querySelector("#selectCountry").value = item.PreferredMetadataCountryCode || "", item.RunTimeTicks) {
            var minutes = item.RunTimeTicks / 6e8;
            context.querySelector("#txtSeriesRuntime").value = Math.round(minutes)
        } else context.querySelector("#txtSeriesRuntime", context).value = ""
    }

    function populateRatings(allParentalRatings, select, currentValue) {
        var html = "";
        html += "<option value=''></option>";
        var i, length, rating, ratings = [],
            currentValueFound = !1;
        for (i = 0, length = allParentalRatings.length; i < length; i++) rating = allParentalRatings[i], ratings.push({
            Name: rating.Name,
            Value: rating.Name
        }), rating.Name === currentValue && (currentValueFound = !0);
        for (currentValue && !currentValueFound && ratings.push({
                Name: currentValue,
                Value: currentValue
            }), i = 0, length = ratings.length; i < length; i++) rating = ratings[i], html += "<option value='" + rating.Value + "'>" + rating.Name + "</option>";
        select.innerHTML = html
    }

    function populateStatus(select) {
        var html = "";
        html += "<option value=''></option>", html += "<option value='Continuing'>" + globalize.translate("sharedcomponents#Continuing") + "</option>", html += "<option value='Ended'>" + globalize.translate("sharedcomponents#Ended") + "</option>", select.innerHTML = html
    }

    function populateListView(list, items, sortCallback) {
        items = items || [], void 0 === sortCallback ? items.sort(function(a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        }) : items = sortCallback(items);
        for (var html = "", i = 0; i < items.length; i++) html += '<div class="listItem">', html += '<i class="md-icon listItemIcon" style="background-color:#333;">live_tv</i>', html += '<div class="listItemBody">', html += '<div class="textValue">', html += items[i], html += "</div>", html += "</div>", html += '<button type="button" is="paper-icon-button-light" data-index="' + i + '" class="btnRemoveFromEditorList autoSize"><i class="md-icon">delete</i></button>', html += "</div>";
        list.innerHTML = html
    }

    function populatePeople(context, people) {
        for (var html = "", elem = context.querySelector("#peopleList"), i = 0, length = people.length; i < length; i++) {
            var person = people[i];
            html += '<div class="listItem">', html += '<i class="md-icon listItemIcon" style="background-color:#333;">person</i>', html += '<div class="listItemBody">', html += '<button style="text-align:left;" type="button" class="btnEditPerson clearButton" data-index="' + i + '">', html += '<div class="textValue">', html += person.Name || "", html += "</div>", person.Role && "" !== person.Role && (html += '<div class="secondary">' + person.Role + "</div>"), html += "</button>", html += "</div>", html += '<button type="button" is="paper-icon-button-light" data-index="' + i + '" class="btnDeletePerson autoSize"><i class="md-icon">delete</i></button>', html += "</div>"
        }
        elem.innerHTML = html
    }

    function getLockedFieldsHtml(fields, currentFields) {
        for (var html = "", i = 0; i < fields.length; i++) {
            var field = fields[i],
                name = field.name,
                value = field.value || field.name,
                checkedHtml = -1 === currentFields.indexOf(value) ? " checked" : "";
            html += "<label>", html += '<input type="checkbox" is="emby-checkbox" class="selectLockedField" data-value="' + value + '"' + checkedHtml + "/>", html += "<span>" + name + "</span>", html += "</label>"
        }
        return html
    }

    function fillMetadataSettings(context, item, lockedFields) {
        var container = context.querySelector(".providerSettingsContainer");
        lockedFields = lockedFields || [];
        var lockedFieldsList = [{
            name: globalize.translate("sharedcomponents#Name"),
            value: "Name"
        }, {
            name: globalize.translate("sharedcomponents#Overview"),
            value: "Overview"
        }, {
            name: globalize.translate("sharedcomponents#Genres"),
            value: "Genres"
        }, {
            name: globalize.translate("sharedcomponents#ParentalRating"),
            value: "OfficialRating"
        }, {
            name: globalize.translate("sharedcomponents#People"),
            value: "Cast"
        }];
        "Person" === item.Type ? lockedFieldsList.push({
            name: globalize.translate("sharedcomponents#BirthLocation"),
            value: "ProductionLocations"
        }) : lockedFieldsList.push({
            name: globalize.translate("sharedcomponents#ProductionLocations"),
            value: "ProductionLocations"
        }), "Series" === item.Type && lockedFieldsList.push({
            name: globalize.translate("Runtime"),
            value: "Runtime"
        }), lockedFieldsList.push({
            name: globalize.translate("sharedcomponents#Studios"),
            value: "Studios"
        }), lockedFieldsList.push({
            name: globalize.translate("sharedcomponents#Tags"),
            value: "Tags"
        });
        var html = "";
        html += "<h2>" + globalize.translate("sharedcomponents#HeaderEnabledFields") + "</h2>", html += "<p>" + globalize.translate("sharedcomponents#HeaderEnabledFieldsHelp") + "</p>", html += getLockedFieldsHtml(lockedFieldsList, lockedFields), container.innerHTML = html
    }

    function reload(context, itemId, serverId) {
        loading.show(), Promise.all([getItem(itemId, serverId), getEditorConfig(itemId, serverId)]).then(function(responses) {
            var item = responses[0];
            metadataEditorInfo = responses[1], currentItem = item;
            var languages = metadataEditorInfo.Cultures,
                countries = metadataEditorInfo.Countries;
            renderContentTypeOptions(context, metadataEditorInfo), loadExternalIds(context, item, metadataEditorInfo.ExternalIdInfos), populateLanguages(context.querySelector("#selectLanguage"), languages), populateCountries(context.querySelector("#selectCountry"), countries), setFieldVisibilities(context, item), fillItemInfo(context, item, metadataEditorInfo.ParentalRatingOptions), "Video" === item.MediaType && "Episode" !== item.Type && "TvChannel" !== item.Type ? showElement("#fldTagline", context) : hideElement("#fldTagline", context), loading.hide()
        })
    }

    function centerFocus(elem, horiz, on) {
        require(["scrollHelper"], function(scrollHelper) {
            var fn = on ? "on" : "off";
            scrollHelper.centerFocus[fn](elem, horiz)
        })
    }

    function show(itemId, serverId, resolve, reject) {
        loading.show(), require(["text!./metadataeditor.template.html"], function(template) {
            var dialogOptions = {
                removeOnClose: !0,
                scrollY: !1
            };
            layoutManager.tv ? dialogOptions.size = "fullscreen" : dialogOptions.size = "medium-tall";
            var dlg = dialogHelper.createDialog(dialogOptions);
            dlg.classList.add("formDialog");
            var html = "";
            html += globalize.translateDocument(template, "sharedcomponents"), dlg.innerHTML = html, layoutManager.tv && centerFocus(dlg.querySelector(".formDialogContent"), !1, !0), dialogHelper.open(dlg), dlg.addEventListener("close", function() {
                layoutManager.tv && centerFocus(dlg.querySelector(".formDialogContent"), !1, !1), resolve()
            }), currentContext = dlg, init(dlg, connectionManager.getApiClient(serverId)), reload(dlg, itemId, serverId)
        })
    }
    var currentContext, metadataEditorInfo, currentItem;
    return {
        show: function(itemId, serverId) {
            return new Promise(function(resolve, reject) {
                return show(itemId, serverId, resolve, reject)
            })
        },
        embed: function(elem, itemId, serverId) {
            return new Promise(function(resolve, reject) {
                loading.show(), require(["text!./metadataeditor.template.html"], function(template) {
                    elem.innerHTML = globalize.translateDocument(template, "sharedcomponents"), elem.querySelector(".formDialogFooter").classList.remove("formDialogFooter"), elem.querySelector(".btnHeaderSave").classList.remove("hide"), elem.querySelector(".btnCancel").classList.add("hide"), currentContext = elem, init(elem, connectionManager.getApiClient(serverId)), reload(elem, itemId, serverId), focusManager.autoFocus(elem)
                })
            })
        }
    }
});