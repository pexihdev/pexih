// Global declarations
declare global {
  interface Window {
    mediaLibraryTarget?: "thumbnail" | "quill";
    currentQuillSelectionIndex?: number;
    toast?: (msg: string) => void;
  }
  const Quill: any;
}

export function initEditor() {
  let quillInstance: any = null;
  window.mediaLibraryTarget = "thumbnail"; // 'thumbnail' | 'quill'
  window.currentQuillSelectionIndex = 0;

  if (typeof Quill !== "undefined") {
    quillInstance = new Quill("#editor-container", {
      theme: "snow",
      modules: {
        toolbar: {
          container: [
            ["bold", "italic", "underline", "strike"],
            ["blockquote", "code-block"],
            [{ header: 1 }, { header: 2 }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
          ],
          handlers: {
            image: function (this: any) {
              window.mediaLibraryTarget = "quill";
              const range = this.quill.getSelection();
              window.currentQuillSelectionIndex = range ? range.index : 0;

              // Open media library modal
              const mediaModal = document.getElementById("media-library-modal");
              const mediaModalContent = mediaModal
                ? mediaModal.firstElementChild
                : null;
              if (mediaModal) {
                mediaModal.classList.remove("opacity-0", "pointer-events-none");
                mediaModal.classList.add("opacity-100");
                if (mediaModalContent) {
                  mediaModalContent.classList.remove("scale-95");
                  mediaModalContent.classList.add("scale-100");
                }
                if (
                  typeof (window as any).triggerUnsplashSearch === "function"
                ) {
                  (window as any).triggerUnsplashSearch("");
                }
              }
            },
          },
        },
      },
    });
  }

  // Character counter for Meta Description
  const metaDescInput = document.getElementById(
    "meta-description-input",
  ) as HTMLInputElement;
  const metaDescCounter = document.getElementById("meta-description-counter");
  if (metaDescInput && metaDescCounter) {
    const updateCounter = () => {
      metaDescCounter.textContent = `${metaDescInput.value.length} / 150`;
    };
    metaDescInput.addEventListener("input", updateCounter);
    // initial update
    updateCounter();
  }

  // === SEO SCORE LOGIC ===
  function updateSeoScore() {
    const titleInput = document.getElementById(
      "title-input",
    ) as HTMLInputElement;
    const metaKeywordsInput = document.getElementById(
      "meta-keywords-input",
    ) as HTMLInputElement;

    const title = titleInput ? titleInput.value.trim() : "";
    const metaDesc = metaDescInput ? metaDescInput.value.trim() : "";
    const keywords = metaKeywordsInput ? metaKeywordsInput.value.trim() : "";
    const contentText = quillInstance
      ? quillInstance.root.innerText.trim()
      : "";

    let score = 0;

    // 1. Title Uniqueness & Length (Max 25 pts)
    let titleScore = 0;
    let titleMsg = "Judul kosong atau terlalu pendek (min 10 karakter).";
    let titleStatus = "❌";

    if (title.length >= 10) {
      titleScore = 15;
      titleMsg = "Panjang judul cukup baik.";
      titleStatus = "⚠️";
      if (title.length >= 25 && title.length <= 65) {
        titleScore = 25;
        titleMsg = "Panjang & keunikan judul sangat ideal (25-65 karakter).";
        titleStatus = "✅";
      } else if (title.length > 65) {
        titleScore = 18;
        titleMsg = "Judul terlalu panjang (idealnya 25-65 karakter).";
        titleStatus = "⚠️";
      }
    }
    score += titleScore;

    const checkTitle = document.getElementById("seo-check-title");
    if (checkTitle) {
      const iconEl = checkTitle.querySelector(".status-icon");
      const descEl = checkTitle.querySelector(".explanation");
      if (iconEl) iconEl.textContent = titleStatus;
      if (descEl) descEl.textContent = titleMsg;
    }

    // 2. Meta Description Length (Max 25 pts)
    let descScore = 0;
    let descMsg =
      "Panjang deskripsi meta kosong atau terlalu pendek (min 45 karakter).";
    let descStatus = "❌";

    if (metaDesc.length >= 45) {
      descScore = 15;
      descMsg = "Panjang deskripsi meta cukup baik.";
      descStatus = "⚠️";
      if (metaDesc.length >= 70 && metaDesc.length <= 150) {
        descScore = 25;
        descMsg = "Panjang deskripsi meta sangat ideal (70-150 karakter).";
        descStatus = "✅";
      }
    }
    score += descScore;

    const checkDesc = document.getElementById("seo-check-desc");
    if (checkDesc) {
      const iconEl = checkDesc.querySelector(".status-icon");
      const descEl = checkDesc.querySelector(".explanation");
      if (iconEl) iconEl.textContent = descStatus;
      if (descEl) descEl.textContent = descMsg;
    }

    // 3. Meta Keywords Match (Max 25 pts)
    let kwScore = 0;
    let kwMsg = "Sebutkan minimal 3 kata kunci yang dipisahkan dengan koma.";
    let kwStatus = "❌";

    if (keywords) {
      const parts = keywords
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean);
      if (parts.length >= 1) {
        kwScore = 10;
        kwMsg = "Tambahkan minimal 3 kata kunci (baru " + parts.length + ").";
        kwStatus = "⚠️";
        if (parts.length >= 3) {
          kwScore = 25;
          kwMsg =
            "Kata kunci meta ideal (" +
            parts.length +
            " kata kunci terdaftar).";
          kwStatus = "✅";
        }
      }
    }
    score += kwScore;

    const checkKeywords = document.getElementById("seo-check-keywords");
    if (checkKeywords) {
      const iconEl = checkKeywords.querySelector(".status-icon");
      const descEl = checkKeywords.querySelector(".explanation");
      if (iconEl) iconEl.textContent = kwStatus;
      if (descEl) descEl.textContent = kwMsg;
    }

    // 4. Content Readability (Max 25 pts)
    let readScore = 0;
    let readMsg = "Konten kosong atau kurang dari 50 kata untuk analisis.";
    let readStatus = "❌";

    const words = contentText.split(/\s+/).filter(Boolean);
    const sentences = contentText
      .split(/[.!?]+/)
      .filter((s: string) => s.trim().length > 0);

    if (words.length >= 50) {
      readScore = 10;
      readMsg =
        "Konten cukup panjang. Tulis minimal 200 kata untuk skor maksimal.";
      readStatus = "⚠️";

      if (words.length >= 200) {
        readScore = 25;
        const avgSentenceLength = words.length / (sentences.length || 1);
        if (avgSentenceLength > 18) {
          readMsg =
            "Keterbacaan baik (" +
            words.length +
            " kata), tapi kalimat cenderung panjang (rata-rata " +
            Math.round(avgSentenceLength) +
            " kata).";
          readStatus = "⚠️";
        } else {
          readMsg =
            "Struktur & Keterbacaan sangat baik (" +
            words.length +
            " kata, rata-rata " +
            Math.round(avgSentenceLength) +
            " kata/kalimat).";
          readStatus = "✅";
        }
      }
    }
    score += readScore;

    const checkReadability = document.getElementById("seo-check-readability");
    if (checkReadability) {
      const iconEl = checkReadability.querySelector(".status-icon");
      const descEl = checkReadability.querySelector(".explanation");
      if (iconEl) iconEl.textContent = readStatus;
      if (descEl) descEl.textContent = readMsg;
    }

    // Set main badge and score bar
    const scoreBadge = document.getElementById("seo-score-badge");
    const scoreBar = document.getElementById("seo-score-bar");

    if (scoreBadge) scoreBadge.textContent = score + "/100";
    if (scoreBar) {
      scoreBar.style.width = score + "%";
      if (score < 40) {
        scoreBar.className =
          "h-full rounded-full transition-all duration-300 bg-red-500";
      } else if (score < 80) {
        scoreBar.className =
          "h-full rounded-full transition-all duration-300 bg-yellow-500";
      } else {
        scoreBar.className =
          "h-full rounded-full transition-all duration-300 bg-green-500";
      }
    }
  }

  // Attach event listeners for real-time SEO updates
  const titleInput = document.getElementById("title-input");
  const keywordsInput = document.getElementById("meta-keywords-input");

  if (titleInput) titleInput.addEventListener("input", updateSeoScore);
  if (metaDescInput) metaDescInput.addEventListener("input", updateSeoScore);
  if (keywordsInput) keywordsInput.addEventListener("input", updateSeoScore);

  if (quillInstance) {
    quillInstance.on("text-change", updateSeoScore);
  }

  // Initial run
  setTimeout(updateSeoScore, 100);

  const articleIdEl = document.getElementById("article-id") as HTMLInputElement;
  const articleId = articleIdEl ? articleIdEl.value || "new" : "new";
  const draftKey = `peXih_draft_${articleId}`;

  // 1. Detect and handle Local Draft Recovery
  const handleDraftRecovery = (draft: any) => {
    const serverTimeEl = document.getElementById(
      "server-timestamp",
    ) as HTMLInputElement;
    const serverTime = parseInt(
      serverTimeEl ? serverTimeEl.value || "0" : "0",
      10,
    );
    const isNewAndHasDraft =
      articleId === "new" &&
      (draft.title ||
        (draft.content &&
          draft.content !== "<p><br></p>" &&
          draft.content !== "<p>Write your beautiful content here...</p>"));
    const isEditAndDraftNewer =
      articleId !== "new" && draft.updatedAt > serverTime + 5000;

    if (isNewAndHasDraft || isEditAndDraftNewer) {
      const restoreToast = document.getElementById("restore-toast");
      const confirmBtn = document.getElementById("confirm-restore");
      const dismissBtn = document.getElementById("dismiss-restore");

      if (restoreToast && confirmBtn && dismissBtn) {
        restoreToast.classList.remove(
          "pointer-events-none",
          "opacity-0",
          "-translate-y-2",
        );
        restoreToast.classList.add("opacity-100", "translate-y-0");

        confirmBtn.addEventListener("click", () => {
          if (draft.title)
            (document.getElementById("title-input") as HTMLInputElement).value =
              draft.title;
          if (draft.category)
            (
              document.getElementById("category-select") as HTMLInputElement
            ).value = draft.category;
          if (draft.status)
            (
              document.getElementById("status-select") as HTMLInputElement
            ).value = draft.status;
          if (draft.publishDateStr)
            (
              document.getElementById("publish-date-input") as HTMLInputElement
            ).value = draft.publishDateStr;
          if (draft.img)
            (document.getElementById("img-input") as HTMLInputElement).value =
              draft.img;
          if (quillInstance && draft.content)
            quillInstance.root.innerHTML = draft.content;

          if (draft.metaDescription !== undefined) {
            const mdInput = document.getElementById(
              "meta-description-input",
            ) as HTMLInputElement;
            if (mdInput) mdInput.value = draft.metaDescription;
            if (metaDescCounter)
              metaDescCounter.textContent = `${draft.metaDescription.length} / 150`;
          }
          if (draft.metaKeywords !== undefined) {
            const mkInput = document.getElementById(
              "meta-keywords-input",
            ) as HTMLInputElement;
            if (mkInput) mkInput.value = draft.metaKeywords;
          }

          if (window.toast) window.toast("Draft restored successfully");
          hideRestoreToast();
        });

        dismissBtn.addEventListener("click", () => {
          localStorage.removeItem(draftKey);
          hideRestoreToast();
        });

        function hideRestoreToast() {
          if (restoreToast) {
            restoreToast.classList.remove("opacity-100", "translate-y-0");
            restoreToast.classList.add(
              "opacity-0",
              "-translate-y-2",
              "pointer-events-none",
            );
          }
        }
      }
    }
  };

  const loadDrafts = () => {
    const savedDraftStr = localStorage.getItem(draftKey);
    let localDraft = null;
    if (savedDraftStr) {
      try {
        localDraft = JSON.parse(savedDraftStr);
      } catch (e) {}
    }

    if (articleId !== "new") {
      fetch(`/api/drafts/latest?articleId=${articleId}`)
        .then((res) => res.json())
        .then((cloudDraft) => {
          if (cloudDraft && localDraft) {
            const cloudDraftMapped = {
              ...cloudDraft,
              updatedAt: cloudDraft.createdAt,
            };
            handleDraftRecovery(
              cloudDraft.createdAt > localDraft.updatedAt
                ? cloudDraftMapped
                : localDraft,
            );
          } else if (cloudDraft) {
            handleDraftRecovery({
              ...cloudDraft,
              updatedAt: cloudDraft.createdAt,
            });
          } else if (localDraft) {
            handleDraftRecovery(localDraft);
          }
        })
        .catch((e) => {
          if (localDraft) handleDraftRecovery(localDraft);
        });
    } else {
      if (localDraft) handleDraftRecovery(localDraft);
    }
  };

  loadDrafts();

  // 2. Set up Auto-Save Interval (every 10 seconds)
  setInterval(() => {
    const titleEl = document.getElementById("title-input") as HTMLInputElement;
    const catEl = document.getElementById(
      "category-select",
    ) as HTMLInputElement;
    const statEl = document.getElementById("status-select") as HTMLInputElement;
    const pubEl = document.getElementById(
      "publish-date-input",
    ) as HTMLInputElement;
    const imgEl = document.getElementById("img-input") as HTMLInputElement;

    if (!titleEl) return;

    const title = titleEl.value.trim();
    const category = catEl ? catEl.value : "";
    const status = statEl ? statEl.value : "draft";
    const publishDateStr = pubEl ? pubEl.value : "";
    const img = imgEl ? imgEl.value.trim() : "";
    const content = quillInstance ? quillInstance.root.innerHTML : "";

    const mdiEl = document.getElementById(
      "meta-description-input",
    ) as HTMLInputElement;
    const mkiEl = document.getElementById(
      "meta-keywords-input",
    ) as HTMLInputElement;
    const metaDescription = mdiEl ? mdiEl.value.trim() : "";
    const metaKeywords = mkiEl ? mkiEl.value.trim() : "";

    // Only save if there is actually some content or title or meta to save
    if (
      !title &&
      !metaDescription &&
      !metaKeywords &&
      (!content ||
        content === "<p><br></p>" ||
        content === "<p>Write your beautiful content here...</p>")
    ) {
      return;
    }

    const draftData = {
      articleId,
      title,
      category,
      status,
      publishDateStr,
      img,
      content,
      metaDescription,
      metaKeywords,
      updatedAt: Date.now(),
    };

    const indicator = document.getElementById("auto-save-indicator");
    if (indicator) {
      indicator.textContent = "Menyimpan...";
      indicator.classList.remove("opacity-0");
    }

    localStorage.setItem(draftKey, JSON.stringify(draftData));

    // Auto-save to cloud
    if (draftData.articleId && draftData.articleId !== "new") {
      try {
        fetch("/api/revisions/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftData),
        })
          .then(() => {
            if (indicator) {
              indicator.textContent = "Draf tersimpan";
              setTimeout(() => {
                indicator.classList.add("opacity-0");
              }, 2500);
            }
          })
          .catch((err) => {
            console.error("Cloud auto-save error:", err);
            if (indicator) {
              indicator.textContent = "Disimpan lokal";
              setTimeout(() => {
                indicator.classList.add("opacity-0");
              }, 2500);
            }
          });
      } catch (err) {}
    } else {
      // For new articles, just say saved locally
      if (indicator) {
        indicator.textContent = "Draf tersimpan (Lokal)";
        setTimeout(() => {
          indicator.classList.add("opacity-0");
        }, 2500);
      }
    }
  }, 10000);

  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
  const saveText = document.getElementById("save-text");
  const saveSpinner = document.getElementById("save-spinner");

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const titleEl = document.getElementById(
        "title-input",
      ) as HTMLInputElement;
      const catEl = document.getElementById(
        "category-select",
      ) as HTMLInputElement;
      const statEl = document.getElementById(
        "status-select",
      ) as HTMLInputElement;
      const pubEl = document.getElementById(
        "publish-date-input",
      ) as HTMLInputElement;
      const imgEl = document.getElementById("img-input") as HTMLInputElement;

      const title = titleEl ? titleEl.value.trim() : "";
      const category = catEl ? catEl.value : "";
      const status = statEl ? statEl.value : "draft";
      const publishDateStr = pubEl ? pubEl.value : "";
      const img = imgEl ? imgEl.value.trim() : "";
      const content = quillInstance ? quillInstance.root.innerHTML : "";

      const mdiEl = document.getElementById(
        "meta-description-input",
      ) as HTMLInputElement;
      const mkiEl = document.getElementById(
        "meta-keywords-input",
      ) as HTMLInputElement;
      const metaDescription = mdiEl ? mdiEl.value.trim() : "";
      const metaKeywords = mkiEl ? mkiEl.value.trim() : "";

      if (!title) {
        if (window.toast) window.toast("Title is required");
        return;
      }

      if (!content || content === "<p><br></p>") {
        if (window.toast) window.toast("Content is required");
        return;
      }

      // Show loading
      if (saveText) saveText.textContent = "Saving...";
      if (saveSpinner) saveSpinner.classList.remove("hidden");
      saveBtn.disabled = true;

      const publishTimestamp = publishDateStr
        ? new Date(publishDateStr).getTime()
        : Date.now();

      // Generate slug
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Calc read time
      const wordCount = quillInstance
        ? quillInstance.root.innerText.trim().split(/\s+/).length
        : 100;
      const readTime = Math.max(1, Math.ceil(wordCount / 200)) + " min read";

      const payload = {
        title,
        category,
        content,
        status,
        publishedAt: publishTimestamp,
        img:
          img ||
          "https://images.unsplash.com/photo-1550000000000?auto=format&fit=crop&w=800&q=80",
        slug,
        readTime,
        metaDescription,
        metaKeywords,
        author: {
          name: "Admin",
          avatar:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
        },
      };

      const url =
        articleId !== "new" ? `/api/articles?id=${articleId}` : "/api/articles";
      const method = articleId !== "new" ? "PUT" : "POST";

      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (res.ok && (result.success || result.data)) {
          // Successfully saved to server -> clear local draft
          localStorage.removeItem(draftKey);

          if (window.toast) {
            window.toast(
              articleId !== "new"
                ? "Article updated successfully"
                : "Article created successfully",
            );
          }
          // Redirect back to content management list after a slight delay
          setTimeout(() => {
            window.location.href = "/admin/content";
          }, 1000);
        } else {
          if (window.toast)
            window.toast(result.error || "Failed to save article");
          resetLoading();
        }
      } catch (err) {
        console.error("Error saving article:", err);
        if (window.toast) window.toast("Error occurred while saving");
        resetLoading();
      }
    });
  }

  function resetLoading() {
    if (saveText) saveText.textContent = "Save";
    if (saveSpinner) saveSpinner.classList.add("hidden");
    if (saveBtn) saveBtn.disabled = false;
  }

  // === MEDIA LIBRARY DIALOG LOGIC ===
  const openMediaBtn = document.getElementById("open-media-library-btn");
  const closeMediaBtn = document.getElementById("close-media-library-btn");
  const mediaModal = document.getElementById("media-library-modal");
  const mediaModalContent = mediaModal ? mediaModal.firstElementChild : null;

  // Tab Buttons
  const tabUnsplashBtn = document.getElementById("tab-unsplash-btn");
  const tabUploadBtn = document.getElementById("tab-upload-btn");
  const tabUnsplashContent = document.getElementById("media-tab-unsplash");
  const tabUploadContent = document.getElementById("media-tab-upload");

  // Unsplash selectors
  const unsplashSearchInput = document.getElementById(
    "unsplash-search-input",
  ) as HTMLInputElement;
  const unsplashSearchBtn = document.getElementById("unsplash-search-btn");
  const unsplashLoader = document.getElementById("unsplash-results-loader");
  const unsplashGrid = document.getElementById("unsplash-results-grid");

  // Upload selectors
  const mediaDropzone = document.getElementById("media-dropzone");
  const mediaFileInput = document.getElementById(
    "media-file-input",
  ) as HTMLInputElement;
  const uploadPreviewContainer = document.getElementById(
    "upload-preview-container",
  );
  const uploadPreviewImg = document.getElementById(
    "upload-preview-img",
  ) as HTMLImageElement;
  const uploadFileName = document.getElementById("upload-file-name");
  const uploadFileSize = document.getElementById("upload-file-size");
  const removeUploadBtn = document.getElementById("remove-upload-btn");
  const startUploadBtn = document.getElementById(
    "start-upload-btn",
  ) as HTMLButtonElement;
  const uploadSpinner = document.getElementById("upload-spinner");

  const imgInput = document.getElementById("img-input") as HTMLInputElement;
  const thumbnailPreview = document.getElementById(
    "thumbnail-preview",
  ) as HTMLImageElement;

  let selectedFile: File | null = null;

  // Close / Open modal
  if (openMediaBtn && mediaModal && closeMediaBtn) {
    openMediaBtn.addEventListener("click", () => {
      window.mediaLibraryTarget = "thumbnail";
      mediaModal.classList.remove("opacity-0", "pointer-events-none");
      mediaModal.classList.add("opacity-100");
      if (mediaModalContent) {
        mediaModalContent.classList.remove("scale-95");
        mediaModalContent.classList.add("scale-100");
      }
      // Load default curated images immediately
      triggerUnsplashSearch("");
    });

    closeMediaBtn.addEventListener("click", () => {
      closeMediaLibraryModal();
    });

    // Click outside to close
    mediaModal.addEventListener("click", (e) => {
      if (e.target === mediaModal) {
        closeMediaLibraryModal();
      }
    });
  }

  function closeMediaLibraryModal() {
    if (mediaModal) {
      mediaModal.classList.add("opacity-0", "pointer-events-none");
      mediaModal.classList.remove("opacity-100");
      if (mediaModalContent) {
        mediaModalContent.classList.add("scale-95");
        mediaModalContent.classList.remove("scale-100");
      }
    }
  }

  // Live update preview on input change
  if (imgInput && thumbnailPreview) {
    imgInput.addEventListener("input", () => {
      thumbnailPreview.src =
        imgInput.value.trim() ||
        "https://images.unsplash.com/photo-1550000000000?auto=format&fit=crop&w=800&q=80";
    });
  }

  // Switch Tabs
  if (
    tabUnsplashBtn &&
    tabUploadBtn &&
    tabUnsplashContent &&
    tabUploadContent
  ) {
    tabUnsplashBtn.addEventListener("click", () => {
      tabUnsplashBtn.className =
        "flex-1 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-orange-600 border-b-2 border-orange-600 transition-all cursor-pointer";
      tabUploadBtn.className =
        "flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 border-b-2 border-transparent hover:text-gray-600 dark:hover:text-gray-350 transition-all cursor-pointer";
      tabUnsplashContent.classList.remove("hidden");
      tabUploadContent.classList.add("hidden");
    });

    tabUploadBtn.addEventListener("click", () => {
      tabUploadBtn.className =
        "flex-1 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-orange-600 border-b-2 border-orange-600 transition-all cursor-pointer";
      tabUnsplashBtn.className =
        "flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 border-b-2 border-transparent hover:text-gray-600 dark:hover:text-gray-350 transition-all cursor-pointer";
      tabUploadContent.classList.remove("hidden");
      tabUnsplashContent.classList.add("hidden");
    });
  }

  // Unsplash Search Logic
  async function triggerUnsplashSearch(query: string) {
    if (!unsplashGrid || !unsplashLoader) return;

    unsplashGrid.innerHTML = "";
    unsplashLoader.classList.remove("hidden");

    try {
      const res = await fetch(
        `/api/media/unsplash?query=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      unsplashLoader.classList.add("hidden");

      if (data && data.results && data.results.length > 0) {
        unsplashGrid.innerHTML = data.results
          .map(
            (img: any) => `
          <div class="group relative rounded-xl overflow-hidden aspect-video border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 hover:border-orange-500 cursor-pointer transition-all active:scale-98 select-image-btn" data-url="${img.urls.regular}">
            <img src="${img.urls.small}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${img.description || "Stock photo"}" referrerpolicy="no-referrer" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p class="text-[7px] text-gray-300 truncate">By ${img.user.name}</p>
            </div>
          </div>
        `,
          )
          .join("");

        // Click listener for image selection
        const imageBtns = unsplashGrid.querySelectorAll(".select-image-btn");
        imageBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            const targetUrl = btn.getAttribute("data-url");
            if (targetUrl) {
              if (
                window.mediaLibraryTarget === "quill" &&
                typeof quillInstance !== "undefined" &&
                quillInstance
              ) {
                quillInstance.insertEmbed(
                  window.currentQuillSelectionIndex || 0,
                  "image",
                  targetUrl,
                );
                quillInstance.setSelection(
                  (window.currentQuillSelectionIndex || 0) + 1,
                );
                if (window.toast) window.toast("Gambar disisipkan");
              } else if (imgInput && thumbnailPreview) {
                imgInput.value = targetUrl;
                thumbnailPreview.src = targetUrl;
                if (window.toast) window.toast("Thumbnail diperbarui");
              }
              closeMediaLibraryModal();
            }
          });
        });
      } else {
        unsplashGrid.innerHTML = `<div class="col-span-2 text-center py-6 text-[10px] text-gray-400 font-bold uppercase">No photos found</div>`;
      }
    } catch (e) {
      console.error(e);
      unsplashLoader.classList.add("hidden");
      if (unsplashGrid) {
        unsplashGrid.innerHTML = `<div class="col-span-2 text-center py-6 text-[10px] text-red-500 font-bold uppercase">Gagal memuat foto</div>`;
      }
    }
  }

  // Bind to window for external calls
  (window as any).triggerUnsplashSearch = triggerUnsplashSearch;

  if (unsplashSearchBtn && unsplashSearchInput) {
    unsplashSearchBtn.addEventListener("click", () => {
      triggerUnsplashSearch(unsplashSearchInput.value.trim());
    });

    unsplashSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        triggerUnsplashSearch(unsplashSearchInput.value.trim());
      }
    });
  }

  // Drag & Drop / Upload Logic
  if (mediaDropzone && mediaFileInput) {
    mediaDropzone.addEventListener("click", () => {
      mediaFileInput.click();
    });

    mediaDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      mediaDropzone.classList.add("border-orange-500", "bg-orange-50/20");
    });

    ["dragleave", "dragend"].forEach((evt) => {
      mediaDropzone.addEventListener(evt, () => {
        mediaDropzone.classList.remove("border-orange-500", "bg-orange-50/20");
      });
    });

    mediaDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      mediaDropzone.classList.remove("border-orange-500", "bg-orange-50/20");
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    mediaFileInput.addEventListener("change", (e) => {
      if (mediaFileInput.files && mediaFileInput.files.length > 0) {
        handleFileSelect(mediaFileInput.files[0]);
      }
    });
  }

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      if (window.toast) window.toast("File must be an image");
      return;
    }

    selectedFile = file;
    if (
      uploadPreviewContainer &&
      uploadPreviewImg &&
      uploadFileName &&
      uploadFileSize &&
      mediaDropzone
    ) {
      uploadFileName.textContent = file.name;
      // Format size
      const sizeKb = file.size / 1024;
      uploadFileSize.textContent =
        sizeKb > 1024
          ? `${(sizeKb / 1024).toFixed(1)} MB`
          : `${sizeKb.toFixed(0)} KB`;

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          uploadPreviewImg.src = e.target.result as string;
          mediaDropzone.classList.add("hidden");
          uploadPreviewContainer.classList.remove("hidden");
        }
      };
      reader.readAsDataURL(file);
    }
  }

  if (removeUploadBtn) {
    removeUploadBtn.addEventListener("click", () => {
      selectedFile = null;
      if (uploadPreviewContainer && mediaDropzone && mediaFileInput) {
        uploadPreviewContainer.classList.add("hidden");
        mediaDropzone.classList.remove("hidden");
        mediaFileInput.value = "";
      }
    });
  }

  if (startUploadBtn) {
    startUploadBtn.addEventListener("click", async () => {
      if (!selectedFile) return;

      startUploadBtn.disabled = true;
      if (uploadSpinner) uploadSpinner.classList.remove("hidden");

      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        startUploadBtn.disabled = false;
        if (uploadSpinner) uploadSpinner.classList.add("hidden");

        if (res.ok && data.success && data.url) {
          if (
            window.mediaLibraryTarget === "quill" &&
            typeof quillInstance !== "undefined" &&
            quillInstance
          ) {
            quillInstance.insertEmbed(
              window.currentQuillSelectionIndex || 0,
              "image",
              data.url,
            );
            quillInstance.setSelection(
              (window.currentQuillSelectionIndex || 0) + 1,
            );
            if (window.toast) window.toast("Gambar disisipkan");

            // Reset dropzone
            selectedFile = null;
            if (uploadPreviewContainer && mediaDropzone && mediaFileInput) {
              uploadPreviewContainer.classList.add("hidden");
              mediaDropzone.classList.remove("hidden");
              mediaFileInput.value = "";
            }
            closeMediaLibraryModal();
          } else if (imgInput && thumbnailPreview) {
            imgInput.value = data.url;
            thumbnailPreview.src = data.url;
            if (window.toast) window.toast("Thumbnail diperbarui!");

            // Reset dropzone
            selectedFile = null;
            if (uploadPreviewContainer && mediaDropzone && mediaFileInput) {
              uploadPreviewContainer.classList.add("hidden");
              mediaDropzone.classList.remove("hidden");
              mediaFileInput.value = "";
            }
            closeMediaLibraryModal();
          }
        } else {
          if (window.toast) window.toast(data.error || "Upload failed");
        }
      } catch (e) {
        console.error(e);
        startUploadBtn.disabled = false;
        if (uploadSpinner) uploadSpinner.classList.add("hidden");
        if (window.toast) window.toast("Gagal mengunggah gambar");
      }
    });
  }

  // Revisions / Riwayat Sunting Handler
  const toggleRevisionsBtn = document.getElementById("toggle-revisions-btn");
  const revisionsListContainer = document.getElementById(
    "revisions-list-container",
  );
  const articleIdVal = articleId;

  if (toggleRevisionsBtn && revisionsListContainer && articleIdVal) {
    let revisionsLoaded = false;

    toggleRevisionsBtn.addEventListener("click", async () => {
      const isHidden = revisionsListContainer.classList.contains("hidden");
      if (isHidden) {
        revisionsListContainer.classList.remove("hidden");
        toggleRevisionsBtn.textContent = "Tutup";

        if (!revisionsLoaded) {
          try {
            const res = await fetch(
              `/api/revisions?articleId=${encodeURIComponent(articleIdVal)}`,
            );
            if (res.ok) {
              const revisions = await res.json();
              revisionsLoaded = true;

              if (revisions.length === 0) {
                revisionsListContainer.innerHTML = `<div class="text-[9px] sm:text-xs text-gray-400 dark:text-gray-500 font-bold text-center py-4 uppercase tracking-wider">Belum ada riwayat suntingan.</div>`;
              } else {
                revisionsListContainer.innerHTML = "";
                revisions.forEach((rev: any) => {
                  const dateStr = new Date(rev.createdAt).toLocaleString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );

                  const item = document.createElement("div");
                  item.className =
                    "flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-all gap-2";
                  item.innerHTML = `
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                      <img src="${rev.editor.avatar}" class="w-6 h-6 rounded-full object-cover shrink-0 border border-orange-200" referrerpolicy="no-referrer" />
                      <div class="min-w-0 flex-1">
                        <p class="text-[10px] sm:text-xs font-bold text-gray-900 dark:text-white truncate">${rev.title}</p>
                        <p class="text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">${dateStr} &bull; ${rev.editor.name}</p>
                      </div>
                    </div>
                    <button type="button" class="restore-rev-btn px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-[8px] sm:text-[10px] font-bold transition-all active:scale-95 shrink-0" data-id="${rev.id}">
                      Pulihkan
                    </button>
                  `;

                  // Bind restore button handler
                  const btn = item.querySelector(
                    ".restore-rev-btn",
                  ) as HTMLButtonElement;
                  btn.addEventListener("click", async () => {
                    if (
                      confirm(
                        "Apakah Anda yakin ingin memulihkan artikel ke versi ini? Draf saat ini akan disimpan sebagai riwayat baru.",
                      )
                    ) {
                      btn.disabled = true;
                      btn.textContent = "Memulihkan...";

                      try {
                        const restoreRes = await fetch("/api/revisions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ revisionId: rev.id }),
                        });

                        if (restoreRes.ok) {
                          // Update local state without reload
                          (
                            document.getElementById(
                              "title-input",
                            ) as HTMLInputElement
                          ).value = rev.title;
                          (
                            document.getElementById(
                              "category-select",
                            ) as HTMLInputElement
                          ).value = rev.category;
                          (
                            document.getElementById(
                              "img-input",
                            ) as HTMLInputElement
                          ).value = rev.img;
                          (
                            document.getElementById(
                              "thumbnail-preview",
                            ) as HTMLImageElement
                          ).src = rev.img;
                          if (quillInstance) {
                            quillInstance.root.innerHTML = rev.content;
                          }

                          if (window.toast) {
                            window.toast("Draf berhasil dipulihkan!");
                          }

                          // Force reload list
                          revisionsLoaded = false;
                          revisionsListContainer.classList.add("hidden");
                          toggleRevisionsBtn.click();
                        } else {
                          const err = await restoreRes.json();
                          alert(
                            "Gagal memulihkan draf: " +
                              (err.error || "Unknown error"),
                          );
                          btn.disabled = false;
                          btn.textContent = "Pulihkan";
                        }
                      } catch (restoreErr) {
                        console.error(restoreErr);
                        alert("Gagal memulihkan draf");
                        btn.disabled = false;
                        btn.textContent = "Pulihkan";
                      }
                    }
                  });

                  revisionsListContainer.appendChild(item);
                });
              }
            } else {
              revisionsListContainer.innerHTML = `<div class="text-[9px] sm:text-xs text-red-500 font-bold text-center py-4 uppercase tracking-wider">Gagal memuat riwayat.</div>`;
            }
          } catch (err) {
            console.error(err);
            revisionsListContainer.innerHTML = `<div class="text-[9px] sm:text-xs text-red-500 font-bold text-center py-4 uppercase tracking-wider">Gagal memuat riwayat.</div>`;
          }
        }
      } else {
        revisionsListContainer.classList.add("hidden");
        toggleRevisionsBtn.textContent = "Lihat Semua";
      }
    });
  }
}
