document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".auth-form__tab-button");
  const forms = document.querySelectorAll(".auth-form__form");

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      if (document.getElementById("admin-table")) {
            document.getElementById("admin-table").style.display = "none";
      }
      const tabName = e.target.getAttribute("data-tab");

      tabs.forEach((t) => {
        t.classList.remove("auth-form__tab-button--active");
        t.setAttribute("aria-selected", "false");
      });
      e.target.classList.add("auth-form__tab-button--active");
      e.target.setAttribute("aria-selected", "true");

      forms.forEach((form) => {
        form.classList.remove("auth-form__form--active");
        if (form.id === tabName) {
          form.classList.add("auth-form__form--active");
        }
      });
    });
  });

  // document.getElementById('register-phone').addEventListener('input', function (e) {
  //     var x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
  //     e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
  // });

  const loginForm = document.getElementById("login");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      const messageEl = document.getElementById("login-message");

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        messageEl.textContent = data.message;
        if (data.success && data.isAdmin) {
          if (document.getElementById("admin-table")) {
            document.getElementById("admin-table").style.display = "flex";
          } else {
          document.querySelector('.main__user-interaction').insertAdjacentHTML('beforeend', `
            <article id="admin-table" class="user-interaction__block user-interaction__block--active">
              <h1 class="user-interaction__title">Admin Panel</h1>
              <table class="user-interaction__admin-table">
                <thead>
                  <tr><th>Email</th><th>Password</th></tr>
                </thead>
                <tbody id="admin-table-body"></tbody>
              </table>
            </article> 
          `);
          }
          await loadAdminTable();
        }
      } catch (error) {
        messageEl.textContent = "Error: Could not connect to server!!!!";
      }
    });
  } else {
    console.error("Login form not found");
  }

  document.getElementById("register").addEventListener("submit", async (e) => {
    e.preventDefault();
    const firstname = document.getElementById("register-firstname").value;
    const lastname = document.getElementById("register-lastname").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const phonenumber = document.getElementById("register-phone").value;
    const confirmPassword = document.getElementById(
      "register-confirm-password"
    ).value;
    const messageEl = document.getElementById("register-message");

    if (password !== confirmPassword) {
      messageEl.textContent = "Passwords do not match";
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstname, lastname, email, password, phonenumber}),
      });
      const data = await response.json();
      messageEl.textContent = data.message;
    } catch (error) {
      console.error("Register fetch error:", error);
      messageEl.textContent = "Error: Could not connect to server";
    }
  });

  async function loadAdminTable() {
    const tableBody = document.getElementById("admin-table-body");
    tableBody.innerHTML = "";
    try {
      const email = document.getElementById("login-email").value;
      const response = await fetch(
        `/api/my_users?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const my_users = await response.json();
      my_users.forEach((user) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${user.email}</td>
                <td>${user.password}</td>
            `;
        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Error loading admin table:", error);
    }
  }
});
