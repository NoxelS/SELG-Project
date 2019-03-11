var express = require("express");
var router = express.Router();
var datetime = require("node-datetime");
var passport = require("passport");
var path = require("path");
var mime = require("mime");
var fs = require("fs");
var bcrypt = require("bcrypt");
const saltRounds = 10;

function userHasAdminPermission() {
  return (req, res, next) => {
    if (res.locals.permission === "admin") return next();
    res.redirect("/");
  };
}

/* Create Kurs Route. */
router.get("/create_kurs", userHasAdminPermission(), function(req, res, next) {
  var handlebars_presettings = {
    layout: "admin",
    title: "SELG-Admintool",
    display_name: null,
    icon_cards: false,
    location: "Kurs erstellen"
  };
  res.render("create/kurs", handlebars_presettings);
});

function genFachName(type) {
  let ret;
  switch (type) {
    case "deutsch":
      ret = "Deutsch";
      break;
    case "englisch":
      ret = "Englisch";
      break;
    case "mathematik":
      ret = "Mathematik";
      break;
    case "gesellschaftslehre":
      ret = "GL";
      break;
    case "musik":
      ret = "Musik";
      break;
    case "bildende_kunst":
      ret = "BK";
      break;
    case "chemie":
      ret = "Chemie";
      break;
    case "biologie":
      ret = "Biologie";
      break;
    case "physik":
      ret = "Physik";
      break;
    case "religion":
      ret = "Religion";
      break;
    case "sport":
      ret = "Sport";
      break;
    case "naturwissenschaften":
      ret = "NAWI";
      break;
    case "sgl":
      ret = "SGL";
      break;
    case "kommunikation_und_medien":
      ret = "Kom&Med";
      break;
    case "oekologie":
      ret = "Ökologie";
      break;
    case "darstellendes_spielen":
      ret = "DS";
      break;
    case "sport_und_gesundheit":
      ret = "Sport&Ges";
      break;
    case "franzoesisch":
      ret = "Französisch";
      break;
    case "technik_und_wirtschaft":
      ret = "Tech&Wirt";
      break;
    case "kunst_und_design":
      ret = "Kunst & Design";
      break;
  }
  return ret;
}
/* Create User Route. */
router.get("/create_user", userHasAdminPermission(), function(req, res, next) {
  var handlebars_presettings = {
    layout: "admin",
    title: "SELG-Admintool",
    icon_cards: false,
    location: "Benutzer erstellen"
  };
  res.render("create/benutzer", handlebars_presettings);
});

router.post("/create_kurs", userHasAdminPermission(), function(req, res, next) {
  const stufe = req.body.stufe;
  const fach = req.body.fach;
  const leistungsebene = req.body.leistungsebene;
  const lehrer_username = req.body.username;

  var db = require("../db");

  // Zugehörigen Lehrer finden
  db.query(
    "SELECT * FROM user_db WHERE username = ?;",
    [lehrer_username],
    function(err, result) {
      if (err) {
        return next(new Error(err.message));
      } else if (result.length == 0) {
        return next(new Error("Diesen Lehrer gibt es nicht..."));
      } else {
        // Wenn der Leher gefunden wurde:

        db.query(
          "INSERT INTO `selg_schema`.`kurs_db` (`name`, `lehrer_name`, `lehrer_id`, `type`, `jahrgang`, `leistungsebene`) VALUES (?, ?, ?, ?, ?, ?);",
          [
            genFachName(fach.toLowerCase()),
            result[0].username,
            result[0].id,
            fach.toLowerCase(),
            stufe,
            leistungsebene
          ],
          function(err, result) {
            if (err) {
              return next(new Error(err.message));
            } else {
              res.redirect("/");
            }
          }
        );
      }
    }
  );
});

// TMP SCRIPT
router.get("/bock", userHasAdminPermission(), function(req, res, next) {
  var db = require("../db");
  var erster_schueler = 150;
  var id_kurs = 35;
  
  for(var id_schueler = erster_schueler; id_schueler <= erster_schueler+30; id_schueler++){
    db.query(
      "INSERT INTO `selg_schema`.`schueler_kurs_link` (`id_schueler`, `id_kurs`) VALUES (?, ?);",
      [id_schueler, id_kurs],
      function(err, result) {
        if (err) return next(new Error(err.message));
        console.log(result);
      }
    );
  }

});

router.post("/create_user", userHasAdminPermission(), function(req, res, next) {
  // Check Password Match
  if (req.body.password !== req.body.password_re)
    return next(new Error("Das Passwort muss übereinstimmen!"));

  // {"vorname":"awgawg","nachname":"awgawg","username":"awgawg","password":"awgawgawg","password_re":"awgawgag","leistungsebene":"admin"}

  if (!req.validationErrors()) {
    const username = req.body.username;
    const password = req.body.password;
    const vorname = req.body.vorname;
    const nachname = req.body.nachname;
    const permission = req.body.permission;

    var db = require("../db.js");
    bcrypt.hash(password, saltRounds, function(err, hash) {
      db.query(
        "INSERT INTO `selg_schema`.`user_db` (`username`, `password`, `permission_flag`, `vorname`, `nachname`) VALUES (?, ?, ?, ?, ?)",
        [username, hash, permission, vorname, nachname],
        function(err, result, fields) {
          if (err) {
            return next(new Error(err.message));
          } else {
            db.query(
              "SELECT LAST_INSERT_ID() as user_id",
              (error, results, fields) => {
                if (error) {
                  return next(new Error(error.message));
                }
                //user_id = results[0]
                /* @TODO 
              req.login(results[0], err => {
                res.redirect("/");
              });
              */
                res.redirect("/");
                console.log(
                  [
                    datetime.create().format("m/d/Y H:M:S"),
                    ": [ NEW USER CREATED ] -> user_id=",
                    results[0].user_id
                  ].join("")
                );
              }
            );
          }
        }
      );
    });
  } else {
    // @TODO - Invalider Benutzer bzw Fehler beim erstellen
    var handlebars_presettings = {
      layout: "admin",
      title: "SELG-Admintool",
      display_name: null,
      icon_cards: false,
      location: "Benutzer löschen",
      error: {
        message: "Beim erstellen des Nutzers ist ein Fehler aufgetreten..."
      }
    };
    res.render("error", handlebars_presettings);
  }
});

/* Edit User Route. */
router.get("/edit_user", userHasAdminPermission(), function(req, res, next) {
  var handlebars_presettings = {
    layout: "admin",
    title: "SELG-Admintool",
    display_name: null,
    icon_cards: false,
    location: "Benutzer bearbeiten"
  };
  res.render("benutzer_edit", handlebars_presettings);
});

/* Delete User Route. */
router.get("/delete_user", userHasAdminPermission(), function(req, res, next) {
  var handlebars_presettings = {
    layout: "admin",
    title: "SELG-Admintool",
    display_name: null,
    icon_cards: false,
    location: "Benutzer löschen"
  };
  res.render("benutzer_delete", handlebars_presettings);
});

/* Create Schueler Route. */
router.get("/create_schueler", userHasAdminPermission(), function(
  req,
  res,
  next
) {
  var handlebars_presettings = {
    layout: "admin",
    title: "SELG-Admintool",
    display_name: null,
    icon_cards: false,
    location: "Schüler erstellen"
  };
  res.render("create/schueler", handlebars_presettings);
});

router.post("/create_schueler", userHasAdminPermission(), function(
  req,
  res,
  next
) {
  // { vorname: '', nachname: '', stufe: '', suffix: '' }
  const vorname = req.body.vorname;
  const nachname = req.body.nachnP;
  const fullname = vorname + " " + nachname;
  const stufe = req.body.stufe;
  const suffix = req.body.suffix;

  var db = require("../db.js");

  db.query(
    "INSERT INTO `selg_schema`.`schueler_db` (`name`, `stufe`, `klassen_suffix`, `vorname`, `nachname`) VALUES (?, ?, ?, ?, ?)",
    [fullname, stufe, suffix, vorname, nachname],
    function(err, result, fields) {
      if (err) {
        return next(new Error(err.message));
      } else {
        db.query(
          "SELECT LAST_INSERT_ID() as schueler_id",
          (error, results, fields) => {
            if (error) {
              return next(new Error(error.message));
            } else {
              // @TODO Suche die Kurse in welchen er Standartmäßig ist
              console.log(`[NEW SCHÜLER] = ${results[0].schueler_id}`);
              res.redirect("/");
            }
          }
        );
      }
    }
  );
});

/* Edit Schüler Route. */
router.get("/edit_schueler", userHasAdminPermission(), function(
  req,
  res,
  next
) {
  var handlebars_presettings = {
    layout: "admin",
    title: "SELG-Admintool",
    display_name: null,
    icon_cards: false,
    location: "Schüler bearbeiten"
  };
  res.render("schueler_edit", handlebars_presettings);
});

/* Delete Schüler Route. */
router.get("/delete_schueler", userHasAdminPermission(), function(
  req,
  res,
  next
) {
  var handlebars_presettings = {
    layout: "admin",
    title: "SELG-Admintool",
    display_name: null,
    icon_cards: false,
    location: "Schüler löschen"
  };
  res.render("schueler_delete", handlebars_presettings);
});

passport.serializeUser(function(user_id, done) {
  done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
  done(null, user_id);
});

// @TODO
/*
router.get("/download", function(req, res) {d
  let pdf = require("handlebars-pdf");
  let paths = __dirname + "/test-" + Math.random() + ".pdf";
  let document = {
    template: `<link href="/css/star-rating.css" rel="stylesheet">

      <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
      <script src="/js/bewertung.js"></script>
      
      <div class="container-fluid mb-3">
          <div class="container-fluid border">
              <br>
              <div class="container-fluid">
                  <div class="card-header" style="background-color: #e9ecef;">
                      Neuer Bewertung für {{schuelername}}
                  </div>
      
                  <div class="card-body">
                      <form action="/bewertung/neu" method="post" autocomplete="off">
      
                          {{!-- META DATA -> Hidden values--}}
                          <input type="hidden" name="schueler_id" id="schueler_id" readonly="readonly" value="{{schuelerid}}">
                          <input type="hidden" name="kurs_id" id="kurs_id" readonly="readonly" value="{{kursid}}"> {{#if missing_value}}
                          <!-- Danger-Nachricht: Wenn nicht alles ausgefüllt wurde-->
      
                          <div class="alert alert-danger alert-dismissible fade show" role="alert">
                              <strong class="h5">Achtung!</strong> Sie müssen alle erforderlichen Felder ausfüllen!
                              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                  <span aria-hidden="true">&times;</span>
                              </button>
                          </div>
                          {{/if}}
      
                          <div class="form-row">
                              <div class="form-group col-md-6">
                                  <label for="name">Name der Schülerin / des Schülers:</label>
                                  <input type="text" name="name" class="form-control" id="name" readonly="readonly" placeholder="{{schuelername}}" value="{{schuelername}}">
      
                              </div>
                              <div class="form-group col-md-2">
                                  <label for="fach">Fach:</label>
                                  <input type="text" name="fach" class="form-control" id="fach" placeholder="Fach" readonly="readonly" placeholder="{{kursname}}"
                                      value="{{kursname}}">
                              </div>
                              {{#if leistungsebene}}
                              <div class="form-group col-md-2">
                                  <label for="leistungsebene">Leistungsebene:</label>
                                  <input type="text" name="leistungsebene" class="form-control" id="leistungsebene" placeholder="leistungsebene" readonly="readonly"
                                      placeholder="{{leistungsebene}}" value="{{leistungsebene}}">
                              </div>
                              {{/if}}
                              {{!--
                              <div class="form-group col-md-2">
                                  <label for="Kurs">Kurs:</label>
                                  <select name="Kurs" class="custom-select">
                                      <option name="Kurs" value="0">Kurs1</option>
                                      <option name="Kurs" value="1">Kurs2</option>
                                      <option name="Kurs" value="2">Kurs3</option>
                                      <option name="Kurs" value="3">Kurs4</option>
                                  </select>
                              </div>--}}
                          </div>
      
                          <div class="form-row mt-3">
                              <div class="form-group col-md-12">
                                  <p>
                                      In einem verbindlichen Gespräch zwischen Schüler/in, Eltern und Tutoren werden Lernentwicklungen und Leistungsstand gewürdigt.
                                      Eine gemeinsame Zielvereinbarung kann die Weiterentwicklung in der Schule unterstützen. Diese
                                      Information über die Lernentwicklung der Schülerin/des Schülers ersetzt gemäß ÜSchO §59 (3)
                                      die Verbalbeurteilung zum Halbjahr.
                                  </p>
                              </div>
                          </div>
      
      
                          <!-- SOZIALVERHALTEN -->
                          <div class="border">
                              <div class="ml-5 mr-1 mt-3 mb-1">
                                  <h5 class="h5 mb-3"> Sozialverhalten</h5>
                              </div>
                              <div class="ml-4 mb-4">
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">1. Du bist anderen gegenüber höflich, rücksichts- und respektvoll.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="star5" name="soz_1" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="star5" onclick="removeComment(1)">☆</label>
                                                  <input id="star4" name="soz_1" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="star4" onclick="removeComment(1)">☆</label>
                                                  <input id="star3" name="soz_1" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="star3" onclick="removeComment(1)">☆</label>
                                                  <input id="star2" name="soz_1" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="star2" onclick="removeComment(1)">☆</label>
                                                  <input id="star1" name="soz_1" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="star1" onclick="addAdditionalComment(1)">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div id="starbox_1"></div>
                                  {{!-- Wird bei einem Stern hinzugefügt
                                  <div class="form-row mb-0" id="startbox_1">
                                      <div class="form-group col-md-6 border mb-0 px-0">
                                          <div class="input-group">
                                              <div class="input-group-prepend">
                                                  <span class="input-group-text no-border">Brgründung:</span>
                                              </div>
                                              <textarea class="form-control no-border" type="text" name="kommentar" id="kommentar" placeholder="..." rows="1"></textarea>
                                          </div>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0"></div>
                                  </div>
                                  --}}
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">2. Du bist hilfsbereit.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="star15" name="soz_2" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="star15" onclick="removeComment(2)">☆</label>
                                                  <input id="star14" name="soz_2" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="star14" onclick="removeComment(2)">☆</label>
                                                  <input id="star13" name="soz_2" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="star13" onclick="removeComment(2)">☆</label>
                                                  <input id="star12" name="soz_2" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="star12" onclick="removeComment(2)">☆</label>
                                                  <input id="star11" name="soz_2" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="star11" onclick="addAdditionalComment(2)">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div id="starbox_2"></div>
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">3. Du kannst Kritik annehmen und umsetzen.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="star25" name="soz_3" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="star25" onclick="removeComment(3)">☆</label>
                                                  <input id="star24" name="soz_3" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="star24" onclick="removeComment(3)">☆</label>
                                                  <input id="star23" name="soz_3" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="star23" onclick="removeComment(3)">☆</label>
                                                  <input id="star22" name="soz_3" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="star22" onclick="removeComment(3)">☆</label>
                                                  <input id="star21" name="soz_3" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="star21" onclick="addAdditionalComment(3)">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div id="starbox_3"></div>
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">4. Du zeigst dich gegenüber fremden Eigentum achtsam.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="star35" name="soz_4" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="star35" onclick="removeComment(4)">☆</label>
                                                  <input id="star34" name="soz_4" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="star34" onclick="removeComment(4)">☆</label>
                                                  <input id="star33" name="soz_4" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="star33" onclick="removeComment(4)">☆</label>
                                                  <input id="star32" name="soz_4" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="star32" onclick="removeComment(4)">☆</label>
                                                  <input id="star31" name="soz_4" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="star31" onclick="addAdditionalComment(4)">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div id="starbox_4"></div>
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-8 border mb-0">
                                          <p class="mb-0 ml-3">5. Du hälst dich an die vereinbarten ...</p>
                                      </div>
                                  </div>
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-5">Gesprächsregeln.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="star45" name="soz_5_1" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="star45" onclick="removeComment(51)">☆</label>
                                                  <input id="star44" name="soz_5_1" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="star44" onclick="removeComment(51)">☆</label>
                                                  <input id="star43" name="soz_5_1" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="star43" onclick="removeComment(51)">☆</label>
                                                  <input id="star42" name="soz_5_1" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="star42" onclick="removeComment(51)">☆</label>
                                                  <input id="star41" name="soz_5_1" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="star41" onclick="addAdditionalComment(51)">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div id="starbox_51"></div>
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-5">Schulregeln.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="star451" name="soz_5_2" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="star451" onclick="removeComment(52)">☆</label>
                                                  <input id="star441" name="soz_5_2" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="star441" onclick="removeComment(52)">☆</label>
                                                  <input id="star431" name="soz_5_2" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="star431" onclick="removeComment(52)">☆</label>
                                                  <input id="star421" name="soz_5_2" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="star421" onclick="removeComment(52)">☆</label>
                                                  <input id="star411" name="soz_5_2" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="star411" onclick="addAdditionalComment(52)">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div id="starbox_52"></div>
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">6. Du trägst mit deinem Verhalten zur guten Gemeinschaft bei.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="star55" name="soz_6" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="star55" onclick="removeComment(6)">☆</label>
                                                  <input id="star54" name="soz_6" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="star54" onclick="removeComment(6)">☆</label>
                                                  <input id="star53" name="soz_6" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="star53" onclick="removeComment(6)">☆</label>
                                                  <input id="star52" name="soz_6" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="star52" onclick="removeComment(6)">☆</label>
                                                  <input id="star51" name="soz_6" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="star51" onclick="addAdditionalComment(6)">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div id="starbox_6"></div>
                              </div>
                          </div>
                          <!-- END OF SOZIALVERHALTEN -->
      
                          <!-- ARBEITSVERHALTEN -->
                          <div class="mt-4 border">
                              <div class="ml-5 mr-1 mt-3 mb-1">
                                  <h5 class="h5 mb-3"> Lern- und Arbeitsverhalten</h5>
                              </div>
                              <div class="ml-4 mb-4">
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">1. Du erscheinst pünktlich zum Unterricht.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="astar5" name="lernab_1" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="astar5">☆</label>
                                                  <input id="astar4" name="lernab_1" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="astar4">☆</label>
                                                  <input id="astar3" name="lernab_1" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="astar3">☆</label>
                                                  <input id="astar2" name="lernab_1" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="astar2">☆</label>
                                                  <input id="astar1" name="lernab_1" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="astar1">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">2. Du sorgst für vollständige Arbeitsmaterialien.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="astar15" name="lernab_2" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="astar15">☆</label>
                                                  <input id="astar14" name="lernab_2" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="astar14">☆</label>
                                                  <input id="astar13" name="lernab_2" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="astar13">☆</label>
                                                  <input id="astar12" name="lernab_2" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="astar12">☆</label>
                                                  <input id="astar11" name="lernab_2" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="astar11">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">3. Du bist zuverlässig und organisierst dich selbst.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="astar25" name="lernab_3" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="astar25">☆</label>
                                                  <input id="astar24" name="lernab_3" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="astar24">☆</label>
                                                  <input id="astar23" name="lernab_3" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="astar23">☆</label>
                                                  <input id="astar22" name="lernab_3" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="astar22">☆</label>
                                                  <input id="astar21" name="lernab_3" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="astar21">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">4. Du arbeitest konzentriert und folgst dem Unterricht aufmerksam.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="astar35" name="lernab_4" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="astar35">☆</label>
                                                  <input id="astar34" name="lernab_4" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="astar34">☆</label>
                                                  <input id="astar33" name="lernab_4" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="astar33">☆</label>
                                                  <input id="astar32" name="lernab_4" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="astar32">☆</label>
                                                  <input id="astar31" name="lernab_4" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="astar31">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">5. Dein Arbeitstempo ist angemessen.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="bastar35" name="lernab_5" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="bastar35">☆</label>
                                                  <input id="bastar34" name="lernab_5" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="bastar34">☆</label>
                                                  <input id="bastar33" name="lernab_5" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="bastar33">☆</label>
                                                  <input id="bastar32" name="lernab_5" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="bastar32">☆</label>
                                                  <input id="bastar31" name="lernab_5" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="bastar31">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">6. Du bist lernbereit und lässt dich nicht so schnell entmutigen.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="cbastar35" name="lernab_6" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="cbastar35">☆</label>
                                                  <input id="cbastar34" name="lernab_6" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="cbastar34">☆</label>
                                                  <input id="cbastar33" name="lernab_6" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="cbastar33">☆</label>
                                                  <input id="cbastar32" name="lernab_6" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="cbastar32">☆</label>
                                                  <input id="cbastar31" name="lernab_6" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="cbastar31">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">7. Du hälst die vereinbarten Regeln zur Heftführung ein.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="dcbastar35" name="lernab_7" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="dcbastar35">☆</label>
                                                  <input id="dcbastar34" name="lernab_7" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="dcbastar34">☆</label>
                                                  <input id="dcbastar33" name="lernab_7" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="dcbastar33">☆</label>
                                                  <input id="dcbastar32" name="lernab_7" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="dcbastar32">☆</label>
                                                  <input id="dcbastar31" name="lernab_7" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="dcbastar31">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">8. Du beteiligst dich aktiv am Unterrichtsgeschehen.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="edcbastar35" name="lernab_8" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="edcbastar35">☆</label>
                                                  <input id="edcbastar34" name="lernab_8" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="edcbastar34">☆</label>
                                                  <input id="edcbastar33" name="lernab_8" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="edcbastar33">☆</label>
                                                  <input id="edcbastar32" name="lernab_8" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="edcbastar32">☆</label>
                                                  <input id="edcbastar31" name="lernab_8" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="edcbastar31">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-8 border mb-0">
                                          <p class="mb-0 ml-3">9. Du arbeitest eigenverantwortlich und selbstbestimmt in Phasen
                                              der ...</p>
                                      </div>
                                  </div>
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-5"><b>Einzelarbeit</b></p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="astar45" name="lernab_9_1" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="astar45">☆</label>
                                                  <input id="astar44" name="lernab_9_1" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="astar44">☆</label>
                                                  <input id="astar43" name="lernab_9_1" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="astar43">☆</label>
                                                  <input id="astar42" name="lernab_9_1" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="astar42">☆</label>
                                                  <input id="astar41" name="lernab_9_1" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="astar41">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-5"><b>Partnerarbeit</b></p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="astar451" name="lernab_9_2" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="astar451">☆</label>
                                                  <input id="astar441" name="lernab_9_2" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="astar441">☆</label>
                                                  <input id="astar431" name="lernab_9_2" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="astar431">☆</label>
                                                  <input id="astar421" name="lernab_9_2" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="astar421">☆</label>
                                                  <input id="astar411" name="lernab_9_2" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="astar411">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-5"><b>Gruppenarbeit</b></p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="bstar451" name="lernab_9_3" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="bstar451">☆</label>
                                                  <input id="bstar441" name="lernab_9_3" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="bstar441">☆</label>
                                                  <input id="bstar431" name="lernab_9_3" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="bstar431">☆</label>
                                                  <input id="bstar421" name="lernab_9_3" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="bstar421">☆</label>
                                                  <input id="bstar411" name="lernab_9_3" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="bstar411">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
      
                                  <div class="form-row mb-0">
                                      <div class="form-group col-md-6 border mb-0">
                                          <p class="mb-0 ml-3">10. Du fertigst deine Hausaufgaben regelmäßig an.</p>
                                      </div>
                                      <div class="form-group col-md-2 border ml-0 mb-0">
                                          <div class="ml-4 mb-0">
                                              <div class="rating">
                                                  <input id="bstar55" name="lernab_10" type="radio" value="5" class="radio-btn hide" />
                                                  <label for="bstar55">☆</label>
                                                  <input id="bstar54" name="lernab_10" type="radio" value="4" class="radio-btn hide" />
                                                  <label for="bstar54">☆</label>
                                                  <input id="bstar53" name="lernab_10" type="radio" value="3" class="radio-btn hide" />
                                                  <label for="bstar53">☆</label>
                                                  <input id="bstar52" name="lernab_10" type="radio" value="2" class="radio-btn hide" />
                                                  <label for="bstar52">☆</label>
                                                  <input id="bstar51" name="lernab_10" type="radio" value="1" class="radio-btn hide" />
                                                  <label for="bstar51">☆</label>
                                                  <div class="clear">
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          <!-- END OF ARBEITSVERHALTEN -->
      
                          <div class="form-group mt-4 mb-1">
                              <label for="exampleFormControlTextarea1">Zusätzlicher Kommentar:</label>
                              <textarea class="form-control" type="text" name="kommentar" id="kommentar" placeholder="Hier ist Platz für einen zusätzlichen Kommentar..."
                                  rows="3"></textarea>
                          </div>
      
                          <button type="submit" value="Submit" class="mt-3 btn btn-primary">Bewertung erstellen</button>
                      </form>
                  </div>
              </div>
          </div>
      </div>`,
    context: {
      display_name: "Noel Schwabenland"
    },
    path: paths
  };

  pdf
    .create(document)
    .then(resPDF => {
      res.download(document.path, "Bewertung.pdf");

      console.log(resPDF);
    })
    .catch(error => {
      console.error(error);
    });
});
*/
module.exports = router;
