import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./Header.css";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import ErrorDialog from "../ErrorDialog";

const Header = ({ userVO = null }) => {
  const { t } = useTranslation();
  const {
    showSuccessMessage,
    showErrorMessage,
    isErrorDialogOpen,
    error,
    hideError,
  } = useErrorHandler();

  const [formData, setFormData] = useState({
    j_username: "",
    j_password: "",
    _spring_security_remember_me: false,
  });

  const [showPasswordRecoveryDialog, setShowPasswordRecoveryDialog] =
    useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [passwordRecoveryRes, setPasswordRecoveryRes] = useState(0);
  const [usernameHidden, setUsernameHidden] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Qui implementeresti la logica di login
    console.log("Login attempt:", formData);

    // Simulazione di errore di autenticazione
    if (formData.j_username === "error@test.com") {
      showErrorMessage(
        t("authentication.authentication_error", "Errore di autenticazione")
      );
      return;
    }

    // Simulazione di login riuscito
    showSuccessMessage("Login", "Login effettuato con successo");
  };

  const valorizeUsernameHidden = () => {
    setUsernameHidden(formData.j_username);
  };

  const handlePasswordForgot = () => {
    valorizeUsernameHidden();

    // Validazione email
    if (!formData.j_username || !formData.j_username.includes("@")) {
      setPasswordRecoveryRes(-1); // Malformed link
      setShowPasswordRecoveryDialog(true);
      return;
    }

    // Simulazione chiamata API
    setTimeout(() => {
      setShowSuccessDialog(true);
    }, 500);
  };

  const getRestrictedAreaLink = () => {
    if (!userVO?.team) return "#";

    const { team } = userVO;
    if (team.type.id === "ADMINISTRATOR") return "administration";
    if (team.type.business) return "business";
    if (!team.type.business) return "home";
    return "#";
  };

  return (
    <div style={{ background: "#e42080" }}>
      <div className="container">
        <div style={{ paddingTop: "13px" }}>
          <div className="f_left">
            <a href="#" title="Vai alla home di PinkCare">
              <img
                src="/styles/olympus/assets/images/logo_pinkcare_white.png"
                alt="PinkCare"
                style={{ marginTop: "20px" }}
                onError={(e) => {
                  // Fallback se l'immagine non esiste
                  e.target.src =
                    "/styles/public/images/logo_pinkcare_white-01.png";
                }}
              />
            </a>
          </div>

          <div className="f_right">
            <form
              id="f"
              name="f"
              className="content"
              method="post"
              onSubmit={handleLogin}
            >
              <input type="hidden" id="j_action" name="j_action" value="null" />

              <div className="row login_pk hidden-xs">
                {!userVO?.team && (
                  <>
                    <div className="col-xs-12 col-md-5">
                      <label>{t("authentication.email", "Email")}</label>
                      <input
                        id="j_username"
                        name="j_username"
                        value={formData.j_username}
                        onChange={handleInputChange}
                        className="autocomplete form-control"
                        autoCapitalize="off"
                        placeholder={t("authentication.email", "Email")}
                      />
                    </div>

                    <div className="col-xs-12 col-md-5">
                      <label>{t("authentication.password", "Password")}</label>
                      <input
                        id="j_password"
                        name="j_password"
                        type="password"
                        value={formData.j_password}
                        onChange={handleInputChange}
                        className="autocomplete form-control"
                      />
                    </div>

                    <div
                      className="col-xs-12 col-md-2"
                      style={{ display: "flex", marginBottom: 0 }}
                    >
                      <button
                        id="signin"
                        name="submit"
                        type="submit"
                        className="btn btn-main btn_log_home"
                      >
                        {t("authentication.login_caps", "LOGIN")}
                      </button>

                      <div className="item" style={{ height: "35px" }}></div>
                    </div>
                  </>
                )}
              </div>

              {userVO?.team && (
                <a
                  href={getRestrictedAreaLink()}
                  className="btn btn-transparent"
                  style={{ margin: "15px" }}
                >
                  {t("standard_public.restricted_area", "Area riservata")}
                </a>
              )}

              {!userVO?.team && (
                <div className="hidden-xs">
                  <div className="col-md-6">
                    <label>
                      <input
                        id="_spring_security_remember_me"
                        name="_spring_security_remember_me"
                        type="checkbox"
                        checked={formData._spring_security_remember_me}
                        onChange={handleInputChange}
                      />{" "}
                      {t("authentication.remember_me", "Resta collegato")}
                    </label>
                  </div>

                  <div className="col-md-6">
                    <a
                      onClick={handlePasswordForgot}
                      className="forgot"
                      style={{ color: "#fff", cursor: "pointer" }}
                    >
                      {t(
                        "authentication.forgot_my_password",
                        "Password dimenticata?"
                      )}
                    </a>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Dialog per recupero password fallito */}
      <ErrorDialog
        isOpen={showPasswordRecoveryDialog}
        onClose={() => setShowPasswordRecoveryDialog(false)}
        error={{
          message:
            passwordRecoveryRes === -1
              ? t("authentication.malformed_link", "Link non corretto")
              : passwordRecoveryRes === -2
              ? t(
                  "authentication.password_recovery_procedure_already_finalized",
                  "Procedura già finalizzata"
                )
              : passwordRecoveryRes === -3
              ? t(
                  "authentication.verification_code_incorrect",
                  "Codice non corretto"
                )
              : "Errore sconosciuto",
        }}
      />

      {/* Dialog per successo recupero password */}
      {showSuccessDialog && (
        <div className="dialog-overlay">
          <div
            className="dialog pnl_dlg"
            style={{
              backgroundColor: "white",
              textAlign: "center",
              width: "442px",
              height: "200px",
            }}
          >
            <div className="dialog-header">
              <div style={{ textAlign: "center" }}>
                <span style={{ fontWeight: "bold" }}>
                  {t(
                    "authentication.successful_operation",
                    "Operazione effettuata con successo"
                  )}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <br />
              <span>
                {t(
                  "authentication.check_your_email_to_access",
                  "Controlla la tua posta elettronica per accedere al sistema"
                )}
              </span>

              <br />
              <br />
              <button
                className="add-to-cart"
                onClick={() => setShowSuccessDialog(false)}
              >
                {t("authentication.ok", "OK")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
