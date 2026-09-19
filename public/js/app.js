const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let session = JSON.parse(localStorage.getItem("sl_session") || "null");

let state = {
    books: [],
    borrows: [],
    users: [],
    fines: [],
    categories: [],
    stats: {},
    page: "dashboard"
};


/* =========================================================
   UTILITIES
========================================================= */

const esc = (value) =>
    String(value ?? "").replace(
        /[&<>"']/g,
        (char) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[char]
    );

const money = (number) =>
    `₹${Number(number || 0).toLocaleString("en-IN")}`;

const date = (value) =>
    value
        ? new Date(value).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric"
          })
        : "—";


/* =========================================================
   TOAST
========================================================= */

function toast(message) {
    const toastElement = $("#toast");

    toastElement.textContent = message;
    toastElement.classList.add("show");

    clearTimeout(toastElement._x);

    toastElement._x = setTimeout(() => {
        toastElement.classList.remove("show");
    }, 3000);
}


/* =========================================================
   API
========================================================= */

async function api(url, options = {}) {
    options.headers = {
        "Content-Type": "application/json",
        ...(session?.token
            ? {
                  Authorization: `Bearer ${session.token}`
              }
            : {})
    };

    const response = await fetch(url, options);

    let data = {};

    try {
        data = await response.json();
    } catch {}

    if (!response.ok) {
        throw Error(data.message || "Request failed");
    }

    return data;
}


/* =========================================================
   THEME
========================================================= */

function setTheme(value) {
    document.body.classList.toggle("dark", value === "dark");

    localStorage.setItem("sl_theme", value);
}

setTheme(localStorage.getItem("sl_theme") || "light");

["themeBtn", "themeAuth"].forEach((id) => {
    $("#" + id).onclick = () =>
        setTheme(
            document.body.classList.contains("dark")
                ? "light"
                : "dark"
        );
});


/* =========================================================
   AUTH FORMS
========================================================= */

function showForm(id) {
    $$(".form").forEach((form) => {
        form.classList.add("hidden");
    });

    $("#" + id).classList.remove("hidden");
}

$$(".tab").forEach((button) => {
    button.onclick = () => {
        $$(".tab").forEach((item) => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        showForm(button.dataset.form);
    };
});

$("#forgotBtn").onclick = () => {
    showForm("forgotForm");
};

$$(".backLogin").forEach((button) => {
    button.onclick = () => {
        showForm("loginForm");
    };
});


/* =========================================================
   LOGIN
========================================================= */

$("#loginForm").onsubmit = async (event) => {
    event.preventDefault();

    try {
        session = await api("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: $("#loginEmail").value,
                password: $("#loginPassword").value
            })
        });

        localStorage.setItem(
            "sl_session",
            JSON.stringify(session)
        );

        await start();
    } catch (error) {
        toast(error.message);
    }
};


/* =========================================================
   STUDENT SIGNUP
========================================================= */

$("#signupForm").onsubmit = async (event) => {
    event.preventDefault();

    try {
        session = await api("/api/auth/signup", {
            method: "POST",
            body: JSON.stringify({
                name: $("#signupName").value,
                email: $("#signupEmail").value,
                studentId: $("#signupStudentId").value,
                password: $("#signupPassword").value
            })
        });

        localStorage.setItem(
            "sl_session",
            JSON.stringify(session)
        );

        await start();
    } catch (error) {
        toast(error.message);
    }
};


/* =========================================================
   FORGOT PASSWORD
========================================================= */

$("#forgotForm").onsubmit = async (event) => {
    event.preventDefault();

    try {
        const data = await api(
            "/api/auth/forgot-password",
            {
                method: "POST",
                body: JSON.stringify({
                    email: $("#forgotEmail").value
                })
            }
        );

        toast(data.message);

        if (data.devResetUrl) {
            console.info(
                "Development reset URL:",
                data.devResetUrl
            );
        }
    } catch (error) {
        toast(error.message);
    }
};


/* =========================================================
   RESET PASSWORD
========================================================= */

const resetToken = new URLSearchParams(
    location.search
).get("reset");

if (resetToken) {
    showForm("resetForm");
}

$("#resetForm").onsubmit = async (event) => {
    event.preventDefault();

    if (
        $("#resetPassword").value !==
        $("#resetConfirm").value
    ) {
        return toast("Passwords do not match");
    }

    try {
        const data = await api(
            "/api/auth/reset-password",
            {
                method: "POST",
                body: JSON.stringify({
                    token: resetToken,
                    password: $("#resetPassword").value
                })
            }
        );

        toast(data.message);

        history.replaceState(
            {},
            "",
            location.pathname
        );

        showForm("loginForm");
    } catch (error) {
        toast(error.message);
    }
};


/* =========================================================
   NAVIGATION
========================================================= */

const adminNav = [
    ["dashboard", "⌂", "Dashboard"],
    ["books", "▤", "Books"],
    ["students", "♙", "Students"],
    ["borrowings", "↗", "Borrowings"],
    ["overdue", "!", "Overdue"],
    ["fines", "₹", "Fines"],
    ["categories", "◇", "Categories"],
    ["profile", "⚙", "Profile"]
];

const studentNav = [
    ["dashboard", "⌂", "Dashboard"],
    ["books", "▤", "Browse books"],
    ["borrowings", "↗", "My borrowings"],
    ["fines", "₹", "My fines"],
    ["profile", "⚙", "Profile"]
];

function buildNav() {
    const nav =
        session.user.role === "admin"
            ? adminNav
            : studentNav;

    $("#nav").innerHTML = nav
        .map(
            ([page, icon, name]) => `
                <button
                    class="nav-btn ${
                        page === state.page
                            ? "active"
                            : ""
                    }"
                    data-page="${page}"
                >
                    <span class="ico">${icon}</span>
                    <span>${name}</span>
                </button>
            `
        )
        .join("");

    $$("[data-page]").forEach((button) => {
        button.onclick = () => {
            go(button.dataset.page);
        };
    });
}

function go(page) {
    state.page = page;

    buildNav();

    $("#sidebar").classList.remove("open");
    $("#scrim").classList.remove("open");

    render();
}


/* =========================================================
   LOAD APPLICATION DATA
========================================================= */

async function load() {
    const calls = [
        api("/api/dashboard/stats"),
        api("/api/books?limit=100"),
        api("/api/borrowings"),
        api("/api/fines"),
        api("/api/categories")
    ];

    if (session.user.role === "admin") {
        calls.push(
            api("/api/users?limit=100")
        );
    }

    const data = await Promise.all(calls);

    state.stats = data[0];
    state.books = data[1].items;
    state.borrows = data[2];
    state.fines = data[3];
    state.categories = data[4];

    if (data[5]) {
        state.users = data[5].items;
    }
}


/* =========================================================
   START APPLICATION
========================================================= */

async function start() {
    try {
        const me = await api("/api/auth/me");

        session.user = me.user;

        localStorage.setItem(
            "sl_session",
            JSON.stringify(session)
        );

        $("#authView").classList.add("hidden");
        $("#appView").classList.remove("hidden");

        const initial = (
            session.user.name || "L"
        )[0].toUpperCase();

        $("#avatar").textContent =
            $("#topAvatar").textContent =
                initial;

        $("#sideName").textContent =
            $("#topName").textContent =
                session.user.name;

        $("#sideRole").textContent =
            session.user.role;

        buildNav();

        await load();

        render();
    } catch (error) {
        localStorage.removeItem("sl_session");

        session = null;

        $("#authView").classList.remove("hidden");
        $("#appView").classList.add("hidden");
    }
}


/* =========================================================
   PAGE TITLES
========================================================= */

function titles(
    title,
    crumb = "Library workspace"
) {
    $("#pageTitle").textContent = title;
    $("#crumb").textContent = crumb;
}


/* =========================================================
   STAT CARDS
========================================================= */

function statsHtml(items) {
    return `
        <div class="stats">
            ${items
                .map(
                    (item) => `
                        <div class="stat">
                            <div class="stat-top">
                                <span>${item[0]}</span>
                                <span>${item[1]}</span>
                            </div>

                            <div class="num">
                                ${item[2]}
                            </div>

                            <div class="metric-note">
                                ${
                                    item[3] ||
                                    "Live system data"
                                }
                            </div>
                        </div>
                    `
                )
                .join("")}
        </div>
    `;
}


/* =========================================================
   EMPTY STATE
========================================================= */

function empty(title, subtitle) {
    return `
        <div class="empty">
            <b>${title}</b>
            ${subtitle}
        </div>
    `;
}


/* =========================================================
   DASHBOARD
========================================================= */

function dashboard() {
    titles("Dashboard", "Overview");

    const isAdmin =
        session.user.role === "admin";

    const stats = state.stats;

    const cards = isAdmin
        ? [
              [
                  "TOTAL COPIES",
                  "▤",
                  stats.totalBooks
              ],
              [
                  "AVAILABLE",
                  "✓",
                  stats.availableBooks
              ],
              [
                  "ACTIVE LOANS",
                  "↗",
                  stats.activeBorrowings
              ],
              [
                  "OVERDUE",
                  "!",
                  stats.overdueBooks
              ],
              [
                  "STUDENTS",
                  "♙",
                  stats.totalStudents
              ],
              [
                  "OUTSTANDING",
                  "₹",
                  money(
                      stats.outstandingFines
                  )
              ],
              [
                  "PAID FINES",
                  "✓",
                  money(stats.paidFines)
              ],
              [
                  "BOOK TITLES",
                  "◇",
                  stats.bookTitles
              ]
          ]
        : [
              [
                  "BORROWED",
                  "↗",
                  stats.currentBorrowed
              ],
              [
                  "OVERDUE",
                  "!",
                  stats.overdueBooks
              ],
              [
                  "CURRENT FINES",
                  "₹",
                  money(stats.currentFines)
              ],
              [
                  "RETURNS",
                  "✓",
                  stats.returnHistory
              ]
          ];

    const recent =
        state.borrows.slice(0, 6);

    return `
        <div class="hero-row">

            <div>
                <h1>
                    ${
                        isAdmin
                            ? "Library operations at a glance"
                            : `Welcome back, ${esc(
                                  session.user.name.split(
                                      " "
                                  )[0]
                              )}`
                    }
                </h1>

                <p>
                    ${
                        isAdmin
                            ? "Monitor circulation, inventory and student activity."
                            : "Your current loans, deadlines and library activity."
                    }
                </p>
            </div>

            ${
                isAdmin
                    ? `
                        <button
                            class="primary btn-inline"
                            onclick="openIssue()"
                        >
                            + Issue a book
                        </button>
                    `
                    : ""
            }

        </div>

        ${statsHtml(cards)}

        <div class="grid2">

            <div class="panel">

                <div class="panel-head">
                    <h3>Recent circulation</h3>
                </div>

                ${
                    recent.length
                        ? `
                            <div class="table-wrap">

                                <table>

                                    <thead>
                                        <tr>
                                            <th>BOOK</th>

                                            <th>
                                                ${
                                                    isAdmin
                                                        ? "STUDENT"
                                                        : "DUE DATE"
                                                }
                                            </th>

                                            <th>STATUS</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        ${recent
                                            .map(
                                                (
                                                    item
                                                ) => `
                                                    <tr>

                                                        <td>
                                                            <b>
                                                                ${esc(
                                                                    item
                                                                        .book
                                                                        ?.title ||
                                                                        "Unknown"
                                                                )}
                                                            </b>

                                                            <br>

                                                            <small>
                                                                ${date(
                                                                    item.issueDate
                                                                )}
                                                            </small>
                                                        </td>

                                                        <td>
                                                            ${
                                                                isAdmin
                                                                    ? esc(
                                                                          item
                                                                              .student
                                                                              ?.name ||
                                                                              "—"
                                                                      )
                                                                    : date(
                                                                          item.dueDate
                                                                      )
                                                            }
                                                        </td>

                                                        <td>
                                                            ${statusBadge(
                                                                item
                                                            )}
                                                        </td>

                                                    </tr>
                                                `
                                            )
                                            .join("")}

                                    </tbody>

                                </table>

                            </div>
                        `
                        : empty(
                              "No circulation yet",
                              "Issued and returned books will appear here."
                          )
                }

            </div>


            <div class="panel">

                <div class="panel-head">
                    <h3>Recently added books</h3>
                </div>

                ${
                    state.books
                        .slice(0, 6)
                        .map(
                            (book) => `
                                <div
                                    style="
                                        padding:12px 18px;
                                        border-top:1px solid var(--line);
                                        display:flex;
                                        justify-content:space-between;
                                    "
                                >

                                    <span>
                                        <b>
                                            ${esc(
                                                book.title
                                            )}
                                        </b>

                                        <br>

                                        <small>
                                            ${esc(
                                                book.author
                                            )}
                                        </small>
                                    </span>

                                    <span
                                        class="badge ${
                                            book.availableCopies
                                                ? "good"
                                                : "bad"
                                        }"
                                    >
                                        ${
                                            book.availableCopies
                                        }/${
                                            book.totalCopies
                                        }
                                    </span>

                                </div>
                            `
                        )
                        .join("") ||
                    empty(
                        "No books yet",
                        "Add your first title to begin."
                    )
                }

            </div>

        </div>
    `;
}


/* =========================================================
   BORROWING STATUS
========================================================= */

function statusBadge(item) {
    if (item.status === "returned") {
        return `
            <span class="badge good">
                Returned
            </span>
        `;
    }

    if (
        new Date(item.dueDate) <
        new Date()
    ) {
        return `
            <span class="badge bad">
                Overdue
            </span>
        `;
    }

    return `
        <span class="badge">
            Borrowed
        </span>
    `;
}


/* =========================================================
   BOOKS PAGE
========================================================= */

function booksPage() {
    titles(
        session.user.role === "admin"
            ? "Books"
            : "Browse books",
        "Catalog"
    );

    return `
        <div class="hero-row">

            <div>
                <h1>Book catalog</h1>

                <p>
                    ${state.books.length}
                    titles in the library collection.
                </p>
            </div>

            ${
                session.user.role === "admin"
                    ? `
                        <button
                            class="primary btn-inline"
                            onclick="openBook()"
                        >
                            + Add book
                        </button>
                    `
                    : ""
            }

        </div>


        <div class="panel">

            <div class="panel-head">

                <h3>Collection</h3>

                <div class="tools">
                    <input
                        id="bookSearch"
                        class="search"
                        placeholder="Search title, author, ISBN..."
                    >
                </div>

            </div>

            <div id="bookTable">
                ${bookTable(state.books)}
            </div>

        </div>
    `;
}


/* =========================================================
   BOOK TABLE
   ADMIN: EDIT / DELETE
   STUDENT: BORROW
========================================================= */

function bookTable(list) {
    const isAdmin =
        session.user.role === "admin";

    return list.length
        ? `
            <div class="table-wrap">

                <table>

                    <thead>
                        <tr>
                            <th>BOOK</th>
                            <th>CATEGORY</th>
                            <th>ISBN</th>
                            <th>SHELF</th>
                            <th>AVAILABILITY</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${list
                            .map((book) => {

                                /*
                                    For students, determine whether
                                    they currently have this book.
                                */

                                const activeBorrow =
                                    !isAdmin
                                        ? state.borrows.find(
                                              (item) =>
                                                  item.status ===
                                                      "borrowed" &&
                                                  item.book?._id ===
                                                      book._id
                                          )
                                        : null;


                                return `
                                    <tr>

                                        <td>

                                            <div class="book-cell">

                                                ${
                                                    book.coverImage
                                                        ? `
                                                            <img
                                                                class="cover"
                                                                src="${esc(
                                                                    book.coverImage
                                                                )}"
                                                                alt="${esc(
                                                                    book.title
                                                                )}"
                                                            >
                                                        `
                                                        : `
                                                            <div class="cover">
                                                                ${esc(
                                                                    book.title?.[0] ||
                                                                        "B"
                                                                )}
                                                            </div>
                                                        `
                                                }

                                                <span>

                                                    <b>
                                                        ${esc(
                                                            book.title
                                                        )}
                                                    </b>

                                                    <br>

                                                    <small>
                                                        ${esc(
                                                            book.author
                                                        )}
                                                    </small>

                                                </span>

                                            </div>

                                        </td>


                                        <td>
                                            ${esc(
                                                book.category
                                            )}
                                        </td>


                                        <td>
                                            ${esc(
                                                book.isbn ||
                                                    "—"
                                            )}
                                        </td>


                                        <td>
                                            ${esc(
                                                book.shelfLocation ||
                                                    "—"
                                            )}
                                        </td>


                                        <td>

                                            <span
                                                class="badge ${
                                                    book.availableCopies >
                                                    0
                                                        ? "good"
                                                        : "bad"
                                                }"
                                            >
                                                ${
                                                    book.availableCopies
                                                }/${
                                                    book.totalCopies
                                                }
                                                available
                                            </span>

                                        </td>


                                        <td>
                                            ${esc(
                                                book.status
                                            )}
                                        </td>


                                        <td>

                                            ${
                                                isAdmin
                                                    ? `
                                                        <div class="actions">

                                                            <button
                                                                class="action"
                                                                onclick="openBook('${book._id}')"
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                class="action danger"
                                                                onclick="deleteBook('${book._id}')"
                                                            >
                                                                Delete
                                                            </button>

                                                        </div>
                                                    `
                                                    : activeBorrow
                                                      ? `
                                                        <span class="badge">
                                                            Borrowed
                                                        </span>
                                                      `
                                                      : book.status !==
                                                          "active"
                                                        ? `
                                                            <span class="badge bad">
                                                                Inactive
                                                            </span>
                                                          `
                                                        : book.availableCopies >
                                                            0
                                                          ? `
                                                            <button
                                                                class="action primary-a"
                                                                onclick="borrowBook('${book._id}')"
                                                            >
                                                                Borrow
                                                            </button>
                                                          `
                                                          : `
                                                            <span class="badge bad">
                                                                Unavailable
                                                            </span>
                                                          `
                                            }

                                        </td>

                                    </tr>
                                `;
                            })
                            .join("")}

                    </tbody>

                </table>

            </div>
        `
        : empty(
              "No books found",
              "Try another search or add a book."
          );
}


/* =========================================================
   STUDENTS PAGE
========================================================= */

function studentsPage() {
    titles(
        "Students",
        "People"
    );

    return `
        <div class="hero-row">

            <div>
                <h1>Student accounts</h1>

                <p>
                    Manage access and student library profiles.
                </p>
            </div>

            <button
                class="primary btn-inline"
                onclick="openStudent()"
            >
                + Add student
            </button>

        </div>


        <div class="panel">

            <div class="panel-head">

                <h3>
                    ${state.users.length} students
                </h3>

                <div class="tools">
                    <input
                        id="userSearch"
                        class="search"
                        placeholder="Search student..."
                    >
                </div>

            </div>

            <div id="userTable">
                ${userTable(state.users)}
            </div>

        </div>
    `;
}

/* =========================================================
   STUDENT TABLE
========================================================= */

function userTable(list) {
    return `
        <div class="table-wrap">

            <table>

                <thead>
                    <tr>
                        <th>STUDENT</th>
                        <th>ID</th>
                        <th>PHONE</th>
                        <th>STATUS</th>
                        <th>JOINED</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>

                <tbody>

                    ${list
                        .map(
                            (user) => `
                                <tr>

                                    <td>
                                        <b>
                                            ${esc(
                                                user.name
                                            )}
                                        </b>

                                        <br>

                                        <small>
                                            ${esc(
                                                user.email
                                            )}
                                        </small>
                                    </td>

                                    <td>
                                        ${esc(
                                            user.studentId ||
                                                "—"
                                        )}
                                    </td>

                                    <td>
                                        ${esc(
                                            user.phone ||
                                                "—"
                                        )}
                                    </td>

                                    <td>
                                        <span
                                            class="badge ${
                                                user.active
                                                    ? "good"
                                                    : "bad"
                                            }"
                                        >
                                            ${
                                                user.active
                                                    ? "Active"
                                                    : "Disabled"
                                            }
                                        </span>
                                    </td>

                                    <td>
                                        ${date(
                                            user.createdAt
                                        )}
                                    </td>

                                    <td>

                                        <div class="actions">

                                            <button
                                                class="action"
                                                onclick="openStudent('${user._id}')"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                class="action"
                                                onclick="toggleStudent('${user._id}', ${!user.active})"
                                            >
                                                ${
                                                    user.active
                                                        ? "Disable"
                                                        : "Enable"
                                                }
                                            </button>

                                        </div>

                                    </td>

                                </tr>
                            `
                        )
                        .join("")}

                </tbody>

            </table>

        </div>
    `;
}


/* =========================================================
   BORROWINGS PAGE
   ADMIN + STUDENT RETURN SUPPORT
========================================================= */

function borrowPage(overdueOnly = false) {
    const isAdmin =
        session.user.role === "admin";

    titles(
        overdueOnly
            ? "Overdue books"
            : isAdmin
              ? "Borrowings"
              : "My borrowings",
        "Circulation"
    );

    const list = overdueOnly
        ? state.borrows.filter(
              (item) =>
                  item.status === "borrowed" &&
                  new Date(item.dueDate) <
                      new Date()
          )
        : state.borrows;

    return `
        <div class="hero-row">

            <div>

                <h1>
                    ${
                        overdueOnly
                            ? "Overdue circulation"
                            : isAdmin
                              ? "Borrowing activity"
                              : "My borrowed books"
                    }
                </h1>

                <p>
                    ${
                        isAdmin
                            ? "Manage issued books, returns and overdue circulation."
                            : "Manage your current and previous library borrowings."
                    }
                </p>

            </div>

            ${
                isAdmin
                    ? `
                        <button
                            class="primary btn-inline"
                            onclick="openIssue()"
                        >
                            + Issue book
                        </button>
                    `
                    : `
                        <button
                            class="primary btn-inline"
                            onclick="go('books')"
                        >
                            + Borrow a book
                        </button>
                    `
            }

        </div>


        <div class="panel">

            <div class="table-wrap">

                <table>

                    <thead>
                        <tr>

                            ${
                                isAdmin
                                    ? "<th>STUDENT</th>"
                                    : ""
                            }

                            <th>BOOK</th>
                            <th>ISSUED</th>
                            <th>DUE</th>
                            <th>STATUS</th>
                            <th>FINE</th>
                            <th>ACTION</th>

                        </tr>
                    </thead>

                    <tbody>

                        ${
                            list.length
                                ? list
                                      .map(
                                          (item) => `
                                            <tr>

                                                ${
                                                    isAdmin
                                                        ? `
                                                            <td>

                                                                <b>
                                                                    ${esc(
                                                                        item
                                                                            .student
                                                                            ?.name ||
                                                                            "—"
                                                                    )}
                                                                </b>

                                                                <br>

                                                                <small>
                                                                    ${esc(
                                                                        item
                                                                            .student
                                                                            ?.studentId ||
                                                                            item
                                                                                .student
                                                                                ?.email ||
                                                                            ""
                                                                    )}
                                                                </small>

                                                            </td>
                                                        `
                                                        : ""
                                                }


                                                <td>

                                                    <div class="book-cell">

                                                        ${
                                                            item
                                                                .book
                                                                ?.coverImage
                                                                ? `
                                                                    <img
                                                                        class="cover"
                                                                        src="${esc(
                                                                            item
                                                                                .book
                                                                                .coverImage
                                                                        )}"
                                                                        alt="${esc(
                                                                            item
                                                                                .book
                                                                                ?.title ||
                                                                                ""
                                                                        )}"
                                                                    >
                                                                `
                                                                : `
                                                                    <div class="cover">
                                                                        ${esc(
                                                                            item
                                                                                .book
                                                                                ?.title?.[0] ||
                                                                                "B"
                                                                        )}
                                                                    </div>
                                                                `
                                                        }

                                                        <span>

                                                            <b>
                                                                ${esc(
                                                                    item
                                                                        .book
                                                                        ?.title ||
                                                                        "Deleted book"
                                                                )}
                                                            </b>

                                                            ${
                                                                item
                                                                    .book
                                                                    ?.author
                                                                    ? `
                                                                        <br>

                                                                        <small>
                                                                            ${esc(
                                                                                item
                                                                                    .book
                                                                                    .author
                                                                            )}
                                                                        </small>
                                                                    `
                                                                    : ""
                                                            }

                                                        </span>

                                                    </div>

                                                </td>


                                                <td>
                                                    ${date(
                                                        item.issueDate
                                                    )}
                                                </td>


                                                <td
                                                    class="${
                                                        item.status ===
                                                            "borrowed" &&
                                                        new Date(
                                                            item.dueDate
                                                        ) <
                                                            new Date()
                                                            ? "overdue"
                                                            : ""
                                                    }"
                                                >
                                                    ${date(
                                                        item.dueDate
                                                    )}
                                                </td>


                                                <td>
                                                    ${statusBadge(
                                                        item
                                                    )}
                                                </td>


                                                <td>
                                                    ${money(
                                                        item.fineAmount
                                                    )}
                                                </td>


                                                <td>

                                                    ${
                                                        item.status ===
                                                        "borrowed"
                                                            ? `
                                                                <button
                                                                    class="action primary-a"
                                                                    onclick="returnBook('${item._id}')"
                                                                >
                                                                    Return
                                                                </button>
                                                            `
                                                            : "—"
                                                    }

                                                </td>

                                            </tr>
                                        `
                                      )
                                      .join("")
                                : `
                                    <tr>

                                        <td
                                            colspan="${
                                                isAdmin
                                                    ? 7
                                                    : 6
                                            }"
                                        >
                                            ${empty(
                                                "No borrowings yet",
                                                isAdmin
                                                    ? "Issued books will appear here."
                                                    : "Browse the catalog and borrow your first book."
                                            )}
                                        </td>

                                    </tr>
                                `
                        }

                    </tbody>

                </table>

            </div>

        </div>
    `;
}


/* =========================================================
   FINES PAGE
========================================================= */

function finesPage() {
    titles(
        session.user.role === "admin"
            ? "Fines"
            : "My fines",
        "Finance"
    );

    return `
        <div class="hero-row">

            <div>

                <h1>
                    ${
                        session.user.role ===
                        "admin"
                            ? "Fine management"
                            : "My fines"
                    }
                </h1>

                <p>
                    Overdue charges remain in history after payment.
                </p>

            </div>

        </div>


        ${statsHtml([
            [
                "UNPAID",
                "₹",
                money(
                    state.fines
                        .filter(
                            (fine) =>
                                fine.status ===
                                "unpaid"
                        )
                        .reduce(
                            (total, fine) =>
                                total +
                                Number(
                                    fine.amount ||
                                        0
                                ),
                            0
                        )
                )
            ],
            [
                "PAID",
                "✓",
                money(
                    state.fines
                        .filter(
                            (fine) =>
                                fine.status ===
                                "paid"
                        )
                        .reduce(
                            (total, fine) =>
                                total +
                                Number(
                                    fine.amount ||
                                        0
                                ),
                            0
                        )
                )
            ]
        ])}


        <div class="panel">

            <div class="table-wrap">

                <table>

                    <thead>
                        <tr>

                            ${
                                session.user.role ===
                                "admin"
                                    ? "<th>STUDENT</th>"
                                    : ""
                            }

                            <th>BOOK</th>
                            <th>DAYS LATE</th>
                            <th>AMOUNT</th>
                            <th>STATUS</th>
                            <th>PAID DATE</th>

                            ${
                                session.user.role ===
                                "admin"
                                    ? "<th>ACTION</th>"
                                    : ""
                            }

                        </tr>
                    </thead>

                    <tbody>

                        ${
                            state.fines
                                .map(
                                    (fine) => `
                                        <tr>

                                            ${
                                                session.user
                                                    .role ===
                                                "admin"
                                                    ? `
                                                        <td>
                                                            ${esc(
                                                                fine
                                                                    .student
                                                                    ?.name ||
                                                                    "—"
                                                            )}
                                                        </td>
                                                    `
                                                    : ""
                                            }

                                            <td>
                                                ${esc(
                                                    fine
                                                        .borrowing
                                                        ?.book
                                                        ?.title ||
                                                        "—"
                                                )}
                                            </td>

                                            <td>
                                                ${
                                                    fine.daysOverdue ||
                                                    0
                                                }
                                            </td>

                                            <td>
                                                <b>
                                                    ${money(
                                                        fine.amount
                                                    )}
                                                </b>
                                            </td>

                                            <td>
                                                <span
                                                    class="badge ${
                                                        fine.status ===
                                                        "paid"
                                                            ? "good"
                                                            : "bad"
                                                    }"
                                                >
                                                    ${esc(
                                                        fine.status
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                ${date(
                                                    fine.paidAt
                                                )}
                                            </td>

                                            ${
                                                session.user
                                                    .role ===
                                                "admin"
                                                    ? `
                                                        <td>
                                                            ${
                                                                fine.status ===
                                                                "unpaid"
                                                                    ? `
                                                                        <button
                                                                            class="action primary-a"
                                                                            onclick="payFine('${fine._id}')"
                                                                        >
                                                                            Mark paid
                                                                        </button>
                                                                    `
                                                                    : "—"
                                                            }
                                                        </td>
                                                    `
                                                    : ""
                                            }

                                        </tr>
                                    `
                                )
                                .join("") ||
                            `
                                <tr>
                                    <td
                                        colspan="${
                                            session.user
                                                .role ===
                                            "admin"
                                                ? 7
                                                : 5
                                        }"
                                    >
                                        ${empty(
                                            "No fines",
                                            "Fine records will appear here."
                                        )}
                                    </td>
                                </tr>
                            `
                        }

                    </tbody>

                </table>

            </div>

        </div>
    `;
}


/* =========================================================
   CATEGORIES PAGE
========================================================= */

function categoriesPage() {
    titles(
        "Categories",
        "Catalog"
    );

    return `
        <div class="hero-row">

            <div>

                <h1>Categories</h1>

                <p>
                    Organize the library collection.
                </p>

            </div>

            <button
                class="primary btn-inline"
                onclick="openCategory()"
            >
                + Add category
            </button>

        </div>


        <div class="panel">

            <div class="table-wrap">

                <table>

                    <thead>
                        <tr>
                            <th>NAME</th>
                            <th>DESCRIPTION</th>
                            <th>STATUS</th>
                            <th>CREATED</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${
                            state.categories
                                .map(
                                    (category) => `
                                        <tr>

                                            <td>
                                                <b>
                                                    ${esc(
                                                        category.name
                                                    )}
                                                </b>
                                            </td>

                                            <td>
                                                ${esc(
                                                    category.description ||
                                                        "—"
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    class="badge ${
                                                        category.status ===
                                                        "active"
                                                            ? "good"
                                                            : "bad"
                                                    }"
                                                >
                                                    ${esc(
                                                        category.status
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                ${date(
                                                    category.createdAt
                                                )}
                                            </td>

                                            <td>
                                                <button
                                                    class="action"
                                                    onclick="openCategory('${category._id}')"
                                                >
                                                    Edit
                                                </button>
                                            </td>

                                        </tr>
                                    `
                                )
                                .join("") ||
                            `
                                <tr>
                                    <td colspan="5">
                                        ${empty(
                                            "No categories",
                                            "Create categories to organize books."
                                        )}
                                    </td>
                                </tr>
                            `
                        }

                    </tbody>

                </table>

            </div>

        </div>
    `;
}


/* =========================================================
   PROFILE PAGE
========================================================= */

function profilePage() {
    titles(
        "Profile",
        "Account"
    );

    const user = session.user;

    return `
        <div
            class="panel"
            style="max-width:720px"
        >

            <div class="panel-head">
                <h3>Account details</h3>
            </div>

            <div style="padding:20px">

                <form
                    id="profileForm"
                    class="form-grid"
                >

                    <div class="field">

                        <label>Name</label>

                        <input
                            id="pName"
                            value="${esc(
                                user.name
                            )}"
                            required
                        >

                    </div>

                    <div class="field">

                        <label>Email</label>

                        <input
                            value="${esc(
                                user.email
                            )}"
                            disabled
                        >

                    </div>

                    <div class="field">

                        <label>Phone</label>

                        <input
                            id="pPhone"
                            value="${esc(
                                user.phone || ""
                            )}"
                        >

                    </div>

                    <div class="field">

                        <label>Role</label>

                        <input
                            value="${esc(
                                user.role
                            )}"
                            disabled
                        >

                    </div>

                    <div class="span2">

                        <button class="primary">
                            Save profile
                        </button>

                    </div>

                </form>

            </div>

        </div>


        <div
            class="panel"
            style="max-width:720px"
        >

            <div class="panel-head">
                <h3>Change password</h3>
            </div>

            <form
                id="passwordForm"
                style="padding:20px"
            >

                <div class="form-grid">

                    <div class="field">

                        <label>
                            Current password
                        </label>

                        <input
                            id="currentPass"
                            type="password"
                            required
                        >

                    </div>

                    <div class="field">

                        <label>
                            New password
                        </label>

                        <input
                            id="newPass"
                            type="password"
                            minlength="8"
                            required
                        >

                    </div>

                </div>

                <button class="primary">
                    Update password
                </button>

            </form>

        </div>
    `;
}


/* =========================================================
   RENDER
========================================================= */

function render() {
    let html =
        state.page === "dashboard"
            ? dashboard()
            : state.page === "books"
              ? booksPage()
              : state.page === "students"
                ? studentsPage()
                : state.page === "borrowings"
                  ? borrowPage()
                  : state.page === "overdue"
                    ? borrowPage(true)
                    : state.page === "fines"
                      ? finesPage()
                      : state.page ===
                          "categories"
                        ? categoriesPage()
                        : profilePage();

    $("#content").innerHTML = html;


    /* -----------------------------------------------------
       BOOK SEARCH
    ----------------------------------------------------- */

    if ($("#bookSearch")) {
        $("#bookSearch").oninput = (event) => {
            const query =
                event.target.value
                    .trim()
                    .toLowerCase();

            $("#bookTable").innerHTML =
                bookTable(
                    state.books.filter(
                        (book) =>
                            (
                                (book.title || "") +
                                " " +
                                (book.author || "") +
                                " " +
                                (book.isbn || "") +
                                " " +
                                (book.category || "")
                            )
                                .toLowerCase()
                                .includes(query)
                    )
                );
        };
    }


    /* -----------------------------------------------------
       STUDENT SEARCH
    ----------------------------------------------------- */

    if ($("#userSearch")) {
        $("#userSearch").oninput = (event) => {
            const query =
                event.target.value
                    .trim()
                    .toLowerCase();

            $("#userTable").innerHTML =
                userTable(
                    state.users.filter(
                        (user) =>
                            (
                                (user.name || "") +
                                " " +
                                (user.email || "") +
                                " " +
                                (user.studentId || "")
                            )
                                .toLowerCase()
                                .includes(query)
                    )
                );
        };
    }


    if ($("#profileForm")) {
        $("#profileForm").onsubmit =
            saveProfile;
    }


    if ($("#passwordForm")) {
        $("#passwordForm").onsubmit =
            changePassword;
    }
}


/* =========================================================
   MODAL
========================================================= */

function modal(
    title,
    body,
    eyebrow = "MANAGE"
) {
    $("#modalTitle").textContent =
        title;

    $("#modalEyebrow").textContent =
        eyebrow;

    $("#modalBody").innerHTML =
        body;

    $("#modal").classList.remove(
        "hidden"
    );
}


function closeModal() {
    $("#modal").classList.add(
        "hidden"
    );
}


$("#modalClose").onclick =
    closeModal;


$("#modal").onclick = (event) => {
    if (
        event.target === $("#modal")
    ) {
        closeModal();
    }
};


/* =========================================================
   BOOK MANAGEMENT
========================================================= */

window.openBook = (id) => {
    const book =
        state.books.find(
            (item) =>
                item._id === id
        ) || {};


    modal(
        id
            ? "Edit book"
            : "Add book",

        `
            <form
                id="bookForm"
                class="form-grid"
            >

                <div class="field">

                    <label>Title</label>

                    <input
                        id="bTitle"
                        required
                        value="${esc(
                            book.title || ""
                        )}"
                    >

                </div>


                <div class="field">

                    <label>Author</label>

                    <input
                        id="bAuthor"
                        required
                        value="${esc(
                            book.author || ""
                        )}"
                    >

                </div>


                <div class="field">

                    <label>Category</label>

                    <input
                        id="bCategory"
                        value="${esc(
                            book.category ||
                                "General"
                        )}"
                    >

                </div>


                <div class="field">

                    <label>ISBN</label>

                    <input
                        id="bIsbn"
                        value="${esc(
                            book.isbn || ""
                        )}"
                    >

                </div>


                <div class="field">

                    <label>
                        Total copies
                    </label>

                    <input
                        id="bCopies"
                        type="number"
                        min="1"
                        required
                        value="${
                            book.totalCopies ||
                            1
                        }"
                    >

                </div>


                <div class="field">

                    <label>
                        Shelf location
                    </label>

                    <input
                        id="bShelf"
                        value="${esc(
                            book.shelfLocation ||
                                ""
                        )}"
                    >

                </div>


                <div class="field">

                    <label>
                        Publisher
                    </label>

                    <input
                        id="bPublisher"
                        value="${esc(
                            book.publisher ||
                                ""
                        )}"
                    >

                </div>


                <div class="field">

                    <label>
                        Language
                    </label>

                    <input
                        id="bLanguage"
                        value="${esc(
                            book.language ||
                                "English"
                        )}"
                    >

                </div>


                <div class="field">

                    <label>
                        Publication year
                    </label>

                    <input
                        id="bYear"
                        type="number"
                        value="${
                            book.publicationYear ||
                            ""
                        }"
                    >

                </div>


                <div class="field">

                    <label>
                        Cover image URL
                    </label>

                    <input
                        id="bCover"
                        value="${esc(
                            book.coverImage ||
                                ""
                        )}"
                    >

                </div>


                <div class="field span2">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="bDesc"
                    >${esc(
                        book.description ||
                            ""
                    )}</textarea>

                </div>


                <div class="span2">

                    <button
                        class="primary"
                        type="submit"
                    >
                        ${
                            id
                                ? "Save changes"
                                : "Add book"
                        }
                    </button>

                </div>

            </form>
        `,

        "CATALOG"
    );


    $("#bookForm").onsubmit =
        async (event) => {

            event.preventDefault();


            const body = {
                title:
                    $("#bTitle").value,

                author:
                    $("#bAuthor").value,

                category:
                    $("#bCategory").value,

                isbn:
                    $("#bIsbn").value ||
                    undefined,

                totalCopies:
                    +$("#bCopies").value,

                shelfLocation:
                    $("#bShelf").value,

                publisher:
                    $("#bPublisher").value,

                language:
                    $("#bLanguage").value,

                publicationYear:
                    +$("#bYear").value ||
                    undefined,

                coverImage:
                    $("#bCover").value,

                description:
                    $("#bDesc").value
            };


            try {

                await api(
                    "/api/books" +
                        (
                            id
                                ? "/" + id
                                : ""
                        ),
                    {
                        method:
                            id
                                ? "PUT"
                                : "POST",

                        body:
                            JSON.stringify(
                                body
                            )
                    }
                );


                closeModal();


                await refresh(
                    id
                        ? "Book updated successfully"
                        : "Book added successfully"
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        };
};


/* =========================================================
   DELETE BOOK
========================================================= */

window.deleteBook = async (id) => {

    if (
        !confirm(
            "Delete this book? Historical borrowing records are preserved."
        )
    ) {
        return;
    }


    try {

        await api(
            "/api/books/" + id,
            {
                method: "DELETE"
            }
        );


        await refresh(
            "Book deleted"
        );

    } catch (error) {

        toast(
            error.message
        );
    }
};


/* =========================================================
   STUDENT MANAGEMENT
========================================================= */

window.openStudent = (id) => {

    const user =
        state.users.find(
            (item) =>
                item._id === id
        ) || {};


    modal(
        id
            ? "Edit student"
            : "Add student",

        `
            <form
                id="studentForm"
                class="form-grid"
            >

                <div class="field">

                    <label>Name</label>

                    <input
                        id="sName"
                        required
                        value="${esc(
                            user.name || ""
                        )}"
                    >

                </div>


                <div class="field">

                    <label>Email</label>

                    <input
                        id="sEmail"
                        type="email"
                        required
                        value="${esc(
                            user.email || ""
                        )}"
                    >

                </div>


                <div class="field">

                    <label>
                        Student ID
                    </label>

                    <input
                        id="sId"
                        value="${esc(
                            user.studentId ||
                                ""
                        )}"
                    >

                </div>


                <div class="field">

                    <label>Phone</label>

                    <input
                        id="sPhone"
                        value="${esc(
                            user.phone || ""
                        )}"
                    >

                </div>


                ${
                    id
                        ? ""
                        : `
                            <div class="field span2">

                                <label>
                                    Temporary password
                                </label>

                                <input
                                    id="sPass"
                                    type="password"
                                    minlength="8"
                                    required
                                >

                            </div>
                        `
                }


                <div class="span2">

                    <button
                        class="primary"
                        type="submit"
                    >
                        Save student
                    </button>

                </div>

            </form>
        `,

        "STUDENT"
    );


    $("#studentForm").onsubmit =
        async (event) => {

            event.preventDefault();


            const body = {
                name:
                    $("#sName").value,

                email:
                    $("#sEmail").value,

                studentId:
                    $("#sId").value ||
                    undefined,

                phone:
                    $("#sPhone").value,

                ...(
                    !id
                        ? {
                              password:
                                  $("#sPass")
                                      .value
                          }
                        : {}
                )
            };


            try {

                await api(
                    "/api/users" +
                        (
                            id
                                ? "/" + id
                                : ""
                        ),
                    {
                        method:
                            id
                                ? "PUT"
                                : "POST",

                        body:
                            JSON.stringify(
                                body
                            )
                    }
                );


                closeModal();


                await refresh(
                    "Student saved"
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        };
};


/* =========================================================
   STUDENT STATUS
========================================================= */

window.toggleStudent = async (
    id,
    active
) => {

    try {

        await api(
            "/api/users/" +
                id +
                "/status",
            {
                method: "PATCH",

                body:
                    JSON.stringify({
                        active
                    })
            }
        );


        await refresh(
            "Student status updated"
        );

    } catch (error) {

        toast(
            error.message
        );
    }
};


/* =========================================================
   STUDENT BORROW BOOK

   NEW FEATURE
========================================================= */

window.borrowBook = async (
    bookId
) => {

    /*
        Find selected book from
        the already-loaded catalog.
    */

    const book =
        state.books.find(
            (item) =>
                item._id === bookId
        );


    if (!book) {
        return toast(
            "Book not found"
        );
    }


    /*
        Do a quick availability check
        before making the API request.

        The backend will ALSO perform
        this check securely.
    */

    if (
        book.status !== "active" ||
        Number(
            book.availableCopies
        ) <= 0
    ) {
        return toast(
            "This book is currently unavailable"
        );
    }


    /*
        Frontend duplicate check.

        This improves the user experience,
        but the backend still performs the
        authoritative duplicate check.
    */

    const alreadyBorrowed =
        state.borrows.some(
            (item) =>
                item.status ===
                    "borrowed" &&
                item.book?._id ===
                    bookId
        );


    if (alreadyBorrowed) {
        return toast(
            "You already borrowed this book"
        );
    }


    const confirmed =
        confirm(
            `Borrow "${book.title}"?\n\n` +
            "Borrowing period: 7 days."
        );


    if (!confirmed) {
        return;
    }


    try {

        await api(
            "/api/borrowings/borrow",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        bookId
                    })
            }
        );


        /*
            Reload:
            - catalog availability
            - student borrowings
            - dashboard statistics
            - fines/categories
        */

        await refresh(
            "Book borrowed successfully"
        );


    } catch (error) {

        toast(
            error.message
        );
    }
};

/* =========================================================
   ISSUE BOOK
   ADMIN ONLY
========================================================= */

window.openIssue = () => {

    /*
        This function is used by Admin.

        Students use the borrowBook()
        function from Part 2 instead.
    */

    modal(
        "Issue a book",

        `
            <form id="issueForm">

                <div class="field">

                    <label>
                        Student
                    </label>

                    <select
                        id="issueStudent"
                        required
                    >

                        <option value="">
                            Select active student
                        </option>

                        ${state.users
                            .filter(
                                (user) =>
                                    user.active
                            )
                            .map(
                                (user) => `
                                    <option
                                        value="${user._id}"
                                    >
                                        ${esc(
                                            user.name
                                        )}

                                        ${
                                            user.studentId
                                                ? " · " +
                                                  esc(
                                                      user.studentId
                                                  )
                                                : ""
                                        }
                                    </option>
                                `
                            )
                            .join("")}

                    </select>

                </div>


                <div class="field">

                    <label>
                        Book
                    </label>

                    <select
                        id="issueBook"
                        required
                    >

                        <option value="">
                            Select available book
                        </option>

                        ${state.books
                            .filter(
                                (book) =>
                                    book.status ===
                                        "active" &&
                                    Number(
                                        book.availableCopies
                                    ) > 0
                            )
                            .map(
                                (book) => `
                                    <option
                                        value="${book._id}"
                                    >
                                        ${esc(
                                            book.title
                                        )}
                                        ·
                                        ${
                                            book.availableCopies
                                        }
                                        available
                                    </option>
                                `
                            )
                            .join("")}

                    </select>

                </div>


                <p class="metric-note">
                    Borrowing period: 7 days.
                    Overdue fine: ₹10 per day.
                </p>


                <button
                    class="primary"
                    type="submit"
                >
                    Confirm issue
                </button>

            </form>
        `,

        "CIRCULATION"
    );


    $("#issueForm").onsubmit =
        async (event) => {

            event.preventDefault();


            const studentId =
                $("#issueStudent").value;

            const bookId =
                $("#issueBook").value;


            if (
                !studentId ||
                !bookId
            ) {
                return toast(
                    "Please select student and book"
                );
            }


            try {

                await api(
                    "/api/borrowings/issue",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                studentId,
                                bookId
                            })
                    }
                );


                closeModal();


                await refresh(
                    "Book issued successfully"
                );


            } catch (error) {

                toast(
                    error.message
                );
            }
        };
};


/* =========================================================
   RETURN BOOK
   ADMIN + STUDENT
========================================================= */

window.returnBook = async (id) => {

    /*
        Admin:
        Can return an active borrowing.

        Student:
        Backend checks that the borrowing
        belongs to the logged-in student.
    */

    if (
        !confirm(
            "Confirm this book return?\n\n" +
            "Any overdue fine will be calculated automatically."
        )
    ) {
        return;
    }


    try {

        const data =
            await api(
                "/api/borrowings/" +
                    id +
                    "/return",
                {
                    method: "POST"
                }
            );


        await refresh(
            `Book returned successfully · Fine ${money(
                data.fineAmount
            )}`
        );


    } catch (error) {

        toast(
            error.message
        );
    }
};


/* =========================================================
   PAY FINE
   ADMIN
========================================================= */

window.payFine = async (id) => {

    if (
        !confirm(
            "Mark this fine as paid?"
        )
    ) {
        return;
    }


    try {

        await api(
            "/api/fines/" +
                id +
                "/pay",
            {
                method: "POST"
            }
        );


        await refresh(
            "Fine marked paid"
        );


    } catch (error) {

        toast(
            error.message
        );
    }
};


/* =========================================================
   CATEGORY MANAGEMENT
========================================================= */

window.openCategory = (id) => {

    const category =
        state.categories.find(
            (item) =>
                item._id === id
        ) || {};


    modal(
        id
            ? "Edit category"
            : "Add category",

        `
            <form id="catForm">

                <div class="field">

                    <label>
                        Name
                    </label>

                    <input
                        id="cName"
                        required
                        value="${esc(
                            category.name ||
                                ""
                        )}"
                    >

                </div>


                <div class="field">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="cDesc"
                    >${esc(
                        category.description ||
                            ""
                    )}</textarea>

                </div>


                ${
                    id
                        ? `
                            <div class="field">

                                <label>
                                    Status
                                </label>

                                <select id="cStatus">

                                    <option
                                        value="active"
                                        ${
                                            category.status ===
                                            "active"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        active
                                    </option>

                                    <option
                                        value="inactive"
                                        ${
                                            category.status ===
                                            "inactive"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        inactive
                                    </option>

                                </select>

                            </div>
                        `
                        : ""
                }


                <button
                    class="primary"
                    type="submit"
                >
                    Save category
                </button>

            </form>
        `,

        "CATALOG"
    );


    $("#catForm").onsubmit =
        async (event) => {

            event.preventDefault();


            try {

                await api(
                    "/api/categories" +
                        (
                            id
                                ? "/" + id
                                : ""
                        ),
                    {
                        method:
                            id
                                ? "PUT"
                                : "POST",

                        body:
                            JSON.stringify({
                                name:
                                    $("#cName")
                                        .value,

                                description:
                                    $("#cDesc")
                                        .value,

                                status:
                                    id
                                        ? $("#cStatus")
                                              .value
                                        : "active"
                            })
                    }
                );


                closeModal();


                await refresh(
                    id
                        ? "Category updated"
                        : "Category created"
                );


            } catch (error) {

                toast(
                    error.message
                );
            }
        };
};


/* =========================================================
   SAVE PROFILE
========================================================= */

async function saveProfile(event) {

    event.preventDefault();


    const name =
        $("#pName").value.trim();

    const phone =
        $("#pPhone").value.trim();


    if (!name) {
        return toast(
            "Name is required"
        );
    }


    try {

        const user =
            await api(
                "/api/users/me/profile",
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            name,
                            phone
                        })
                }
            );


        /*
            Update the locally stored
            authenticated user.
        */

        session.user = {
            ...session.user,
            ...user
        };


        localStorage.setItem(
            "sl_session",
            JSON.stringify(
                session
            )
        );


        /*
            Refresh visible user data.
        */

        const initial =
            (
                session.user.name ||
                "L"
            )[0].toUpperCase();


        $("#avatar").textContent =
            initial;

        $("#topAvatar").textContent =
            initial;


        $("#sideName").textContent =
            session.user.name;

        $("#topName").textContent =
            session.user.name;


        render();


        toast(
            "Profile updated"
        );


    } catch (error) {

        toast(
            error.message
        );
    }
}


/* =========================================================
   CHANGE PASSWORD
========================================================= */

async function changePassword(event) {

    event.preventDefault();


    const currentPassword =
        $("#currentPass").value;

    const newPassword =
        $("#newPass").value;


    if (
        !currentPassword ||
        !newPassword
    ) {
        return toast(
            "Enter current and new password"
        );
    }


    if (
        newPassword.length < 8
    ) {
        return toast(
            "New password must be at least 8 characters"
        );
    }


    try {

        const data =
            await api(
                "/api/users/me/password",
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            currentPassword,
                            newPassword
                        })
                }
            );


        event.target.reset();


        toast(
            data.message ||
                "Password updated"
        );


    } catch (error) {

        toast(
            error.message
        );
    }
}


/* =========================================================
   REFRESH DATA
========================================================= */

async function refresh(message) {

    try {

        /*
            Reload everything that the current
            authenticated user is allowed to see.

            This is important after:
            - borrowing
            - returning
            - issuing
            - paying fine
            - adding/editing books
            - changing student status
        */

        await load();


        /*
            Rebuild the current page using
            the newly loaded data.
        */

        render();


        if (message) {
            toast(
                message
            );
        }


    } catch (error) {

        toast(
            error.message ||
                "Unable to refresh data"
        );
    }
}


/* =========================================================
   GLOBAL REFRESH BUTTON
========================================================= */

$("#refreshBtn").onclick = () =>
    refresh(
        "Data refreshed"
    );


/* =========================================================
   LOGOUT
========================================================= */

$("#logout").onclick =
    async () => {

        try {

            await api(
                "/api/auth/logout",
                {
                    method: "POST"
                }
            );

        } catch {
            /*
                Even if server logout fails,
                remove the local session.
            */
        }


        localStorage.removeItem(
            "sl_session"
        );


        session = null;


        location.reload();
    };


/* =========================================================
   MOBILE MENU
========================================================= */

$("#menuBtn").onclick = () => {

    $("#sidebar").classList.add(
        "open"
    );


    $("#scrim").classList.add(
        "open"
    );
};


$("#scrim").onclick = () => {

    $("#sidebar").classList.remove(
        "open"
    );


    $("#scrim").classList.remove(
        "open"
    );
};


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape"
        ) {

            /*
                Close modal if open.
            */

            if (
                !$("#modal").classList.contains(
                    "hidden"
                )
            ) {
                closeModal();
            }


            /*
                Close mobile sidebar.
            */

            $("#sidebar").classList.remove(
                "open"
            );

            $("#scrim").classList.remove(
                "open"
            );
        }
    }
);


/* =========================================================
   INITIALIZE APPLICATION
========================================================= */

if (session) {

    /*
        User has a locally stored login session.

        start() verifies it with /api/auth/me
        before showing the application.
    */

    start();

} else {

    /*
        No login session.

        Keep authentication page visible.
    */

    $("#authView").classList.remove(
        "hidden"
    );

    $("#appView").classList.add(
        "hidden"
    );
}