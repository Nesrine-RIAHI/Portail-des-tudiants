
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const pasth = require("path");

const app = express();
app.use(express.json());
app.use(cors());


// Logger pour toutes les requêtes
app.use((req, res, next) => {
  console.log(`>>> ${new Date().toLocaleString()} - ${req.method} ${req.url} - Body: ${JSON.stringify(req.body || {})}`);
  next();
});

// Connexion MongoDB
mongoose.connect("mongodb://localhost:27017/crud")
  .then(() => console.log("✅ Connecté à MongoDB !"))
  .catch(err => console.error("❌ Erreur MongoDB :", err));

// Schéma User
const UserSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
});
const UserModel = mongoose.model("users", UserSchema);

// GET /getUsers
app.get("/getUsers", (req, res) => {
  UserModel.find({}).then(users => res.json(users))
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: err.message });
    });
});

// POST /signup
app.post("/signup", async (req, res) => {
  console.log(">>> Signup route touchée !");
  try {
    const { firstname, lastname, email, password, role } = req.body;
    
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email déjà utilisé !" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ firstname, lastname, email, password: hashedPassword, role });
    await newUser.save();
    res.json({ message: "Inscription réussie ! Bienvenue " + firstname });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Erreur serveur inscription" });
  }
});
console.log("Route POST /signup chargée !"); // Debug : Doit s'afficher au démarrage

// POST /login
app.post("/login", async (req, res) => {
  console.log(">>> Login route touchée !");
  try {
    const { username, password } = req.body;
    
    const user = await UserModel.findOne({ email: username });
    if (!user) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect !" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect !" });
    }
    
    res.json({ 
      message: "Connexion réussie ! Bienvenue " + user.firstname,
      user: { firstname: user.firstname, lastname: user.lastname, role: user.role }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Erreur serveur connexion" });
  }
});
console.log("Route POST /login chargée !"); // Debug
// GET /faqs : FAQs trusted pour nouveaux étudiants (étendu 2025)
app.get("/faqs", (req, res) => {
  const faqsData = [
    {
      question: "Comment s'inscrire à la FSM pour l'année universitaire 2025-2026 ?",
      reponse: "Les inscriptions se font via le portail e-Étudiants du ministère (www.inscription.tn) du 15 juin au 15 juillet 2025. Étapes : Créez un compte, remplissez le formulaire, joignez CIN, bulletin de notes du bac, et photo. Résultats publiés mi-août. Si admis, payez les frais administratifs (50 DT/semestre) avant le 10 septembre.",
      lien: "https://fsm.rnu.tn/fra/articles/4992/appel-a-candidature-aux-masteres-2025-2026"
    },
    {
      question: "Quelles sont les filières disponibles à la FSM pour les nouveaux étudiants ?",
      reponse: "Licences fondamentales : Mathématiques, Informatique, Physique, Chimie, Sciences de la Terre (L1 à L3). Masters : IA, Modélisation Mathématique, Génie Physique. Places limitées par concours national (environ 500 pour L1). Consultez les brochures pour débouchés (recherche, industrie, enseignement).",
      lien: "https://fsm.rnu.tn/fra/formation-initiale/licences"
    },
    {
      question: "Où trouver le calendrier académique 2025-2026 ?",
      reponse: "Rentrée officielle : 13 septembre 2025. Semestre 1 : Cours jusqu'au 20 décembre, examens 5-20 janvier 2026. Semestre 2 : Février-juin 2026. Vacances : 1-15 novembre, 15-30 mars. Téléchargez le PDF complet sur le site FSM pour dates précises d'examens et inscriptions.",
      lien: "https://fsm.rnu.tn/fra/calendrier-universitaire-2025-2026"
    },
    {
      question: "Quels documents pour l'inscription administrative à la FSM ?",
      reponse: "Obligatoires : CIN original + copie, 4 photos d'identité, attestation de réussite au bac + relevé de notes, certificat médical (modèle fourni par FSM). Optionnel : Certificat de bourse. Présentez-les au bureau des inscriptions avant le 20 septembre 2025. Frais : 50 DT/semestre, payable en cash ou virement.",
      lien: "https://um.rnu.tn/fr/inscription-administrative/"
    },
    {
      question: "Comment contacter l'administration FSM pour les nouveaux étudiants ?",
      reponse: "Bureau des inscriptions : Tél. +216 73 500 002, email scolarite@fsm.rnu.tn. Accueil : Lundi-vendredi 8h-16h. Adresse physique : Avenue de l'Environnement, 5019 Monastir. Pour orientation, contactez le service pédagogique au +216 73 500 003. Réponse sous 48h pour emails.",
      lien: "https://fsm.rnu.tn/fra/contact"
    },
    {
      question: "Y a-t-il des bourses pour les nouveaux étudiants à la FSM ?",
      reponse: "Oui, bourses d'excellence (200 DT/mois) pour top 10% du bac, via ministère (candidature en ligne 1-30 août 2025). Aides locales FSM pour familles modestes (50 DT/semestre). Critères : Moyenne bac >15/20, revenus familiaux <2000 DT/mois. Dossier : CIN, bulletins, attestation revenus.",
      lien: "https://www.mesrs.tn/bourses-etudiantes/"
    },
    {
      question: "Comment s'orienter dans les filières FSM après le bac ?",
      reponse: "Journée d'orientation gratuite le 10 septembre 2025 (10h-16h au campus). Tests en ligne sur portail UM (personnalité + aptitudes). Brochures par filière disponibles au bureau orientation. Conseillers : 1 par 50 étudiants. Choisissez selon notes bac et intérêts (ex. : Maths >14/20 pour Informatique).",
      lien: "https://um.rnu.tn/fr/orientation/"
    },
    {
      question: "Quelles sont les dates des examens de rattrapage pour L1 2025 ?",
      reponse: "Rattrapages S1 : 25-30 janvier 2026 ; S2 : 15-20 juillet 2026. Inscription obligatoire 1 semaine avant via e-Étudiants. Coût : 10 DT/module. Présence obligatoire avec convocation. Consultez le calendrier pour horaires par filière.",
      lien: "https://fsm.rnu.tn/fra/examens-rattrapage-2025"
    }
  ];
  res.json(faqsData);
});
// GET /transport-schedules : Horaires metro Sahel (SNCFT 2025, Monastir/FSM vers Sahel)
app.get("/transport-schedules", (req, res) => {
  const schedules = {
    weekdays: [
      { departure: "06:00", arrival: "06:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "07:30", arrival: "07:50", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "09:00", arrival: "09:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "11:00", arrival: "11:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "14:00", arrival: "14:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "16:00", arrival: "16:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "18:00", arrival: "18:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "20:00", arrival: "20:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" }
    ],
    weekends: [
      { departure: "08:00", arrival: "08:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "10:00", arrival: "10:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "12:00", arrival: "12:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "14:00", arrival: "14:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "16:00", arrival: "16:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" },
      { departure: "18:00", arrival: "18:20", duration: "20 min", cost: "0.6 TND", station: "Monastir → Sahel" }
    ]
  };
  res.json(schedules);
});

// GET /transport-comparatif : Options comparatives (FSM → Sahel, estimés 2025)
app.get("/transport-comparatif", (req, res) => {
  const options = [
    { nom: "Metro Sahel (SNCFT)", duree: "20 min", cout: "0.6 TND", co2: "0.1 kg", idealPour: "Économique & Écologique" },
    { nom: "Bus Local (SNCTI)", duree: "25 min", cout: "0.5 TND", co2: "0.2 kg", idealPour: "Budget serré" },
    { nom: "Taxi (Monastir-Sahel)", duree: "10 min", cout: "5 TND", co2: "0.5 kg", idealPour: "Rapide & Confort" },
    { nom: "Vélo / Marche", duree: "30 min", cout: "0 TND", co2: "0 kg", idealPour: "Santé & Zéro Émission" }
  ];
  res.json(options);
});

// GET /faqs?category=transports : FAQ transports étudiants FSM (curatées 2025)
app.get("/faqs", (req, res) => {
  const category = req.query.category || 'general';
  let faqsData = [];
  if (category === 'transports') {
    faqsData = [
      {
        question: "Comment acheter un ticket pour le metro Sahel depuis FSM ?",
        reponse: "Achetez aux guichets SNCFT à la gare Monastir (près FSM) ou machines automatiques. Prix : 0.6 TND simple trajet. Abonnement mensuel : 15 TND pour étudiants (réduction 50% avec carte FSM). Valable 1h30.",
        lien: "https://www.sncft.com.tn/banlieue-du-sahel/"
      },
      {
        question: "Quels sont les horaires du metro Sahel les soirs/semaines ?",
        reponse: "Weekdays : 6h-20h (toutes les 2h). Weekends : 8h-18h (toutes les 2h). Dernier départ Monastir 20h (arrivée Sahel 20h20). Retards possibles ; vérifiez app SNCFT.",
        lien: "https://www.sncft.com.tn/banlieue-du-sahel/horaires/"
      },
      {
        question: "Y a-t-il des bus gratuits ou réduits pour étudiants FSM vers Sahel ?",
        reponse: "Bus SNCTI ligne 20 (Monastir-Sahel) : 0.5 TND, réduction 50% (0.25 TND) avec carte étudiant FSM. Gratuit pour boursiers. Horaires : 6h-21h, toutes les 30 min.",
        lien: "https://www.transport.tn/lignes-bus-monastir/"
      },
      {
        question: "Comment combiner metro + bus pour FSM-Sahel ?",
        reponse: "Prenez metro ligne Sahel depuis gare Monastir (5 min à pied de FSM) jusqu'à station intermédiaire, puis bus local (billet combo 0.8 TND). Temps total : 25 min. App 'Moovit' pour itinéraires live.",
        lien: "https://moovitapp.com/index/fr/transport_en_commun-FSM_Monastir-Tunis-102"
      },
      {
        question: "Y a-t-il des options écologiques (vélo/car-sharing) pour étudiants FSM ?",
        reponse: "Vélo partagé 'TunisBike' : Stations près FSM, 1 TND/30 min. Car-sharing 'Yassir Go' : 3 TND/trajet partagé Sahel. Zéro CO2 pour vélo ; app FSM Eco-Transport pour réductions.",
        lien: "https://www.yassir.com/go/tunisie"
      },
      {
        question: "Que faire en cas de retard ou annulation metro Sahel ?",
        reponse: "Contact SNCFT hotline +216 71 330 000 ou app pour remboursement (50% si >30 min retard). Alternative : Bus SNCTI ligne 20 (fréquent). Suivez Twitter @SNCFT_Tunisie pour alertes live.",
        lien: "https://twitter.com/SNCFT_Tunisie"
      }
    ];
  } else {
    // Ton ancien /faqs général
    faqsData = [ /* ... ton code précédent pour général ... */ ];
  }
  res.json(faqsData);
});

app.listen(3001, () => {
  console.log("🚀 Serveur lancé sur http://localhost:3001");
});
// GET /news : Données trusted pour Actualités (statique pour l'instant)
app.get("/news", (req, res) => {
  const newsData = {
    stories: [ // Success Stories (étudiants/alumni motivants)
      {
        titre: "Forum FSM 2.0 : Success Stories pour la Cohorte 3 (2024-2025)",
        description: "Ateliers pratiques sur la création de CV et témoignages inspirants d'anciens étudiants pour guider votre parcours professionnel.",
        type: "success",
        lien: "https://www.facebook.com/fsmforumv2/"
      },
      {
        titre: "Success Stories du 20ᵉ Anniversaire de l'Université de Monastir",
        description: "Témoignages d'anciens de FSM sur leurs carrières réussies en recherche et industrie.",
        type: "success",
        lien: "https://um.rnu.tn/fr/plan-de-site/"
      },
      {
        titre: "Enquête de Satisfaction Apprenants FSM (Fin A.U. 2024-2025)",
        description: "3755 vues et retours positifs sur les parcours étudiants, avec focus sur les réussites en master et thèse.",
        type: "success",
        lien: "https://fsm.rnu.tn/fra/articles/4947/enquete-de-satisfaction-apprenants---fin-a.u.-2024-2025"
      }
    ],
    research: [ // Recherche & Innovation
      {
        titre: "CTIP'25 : Control Theory & Inverse Problems",
        description: "Séminaire international sur la théorie du contrôle et problèmes inverses, organisé par FSM en 2025.",
        type: "research",
        lien: "https://fsm.rnu.tn/"
      },
      {
        titre: "Séminaire Équations aux Dérivées Partielles (Avril-Juin 2025)",
        description: "Focus sur les avancées en modélisation mathématique et applications innovantes.",
        type: "research",
        lien: "https://fsm.rnu.tn/"
      },
      {
        titre: "Comité Mixte Tuniso-Algérien pour Recherche & Innovation",
        description: "Projets collaboratifs en excellence scientifique, avec labs mixtes pour innovations croisées.",
        type: "research",
        lien: "https://um.rnu.tn/fr/recherche-scientifique/projets-de-recherche/"
      },
      {
        titre: "Séminaire IA en Recherche Scientifique (02/2025)",
        description: "Application de l'intelligence artificielle à la recherche, organisé par l'Université de Monastir.",
        type: "research",
        lien: "https://um.rnu.tn/fr/actualit%C3%A9s/s%C3%A9minaire-sur-lapplication-de-lintelligence-artificielle-%C3%A0-la-recherche-scientifique/"
      }
    ],
    events: [ // Événements (bonus, pour compléter)
      {
        titre: "Journée d'Intégration 2025-2026",
        description: "Accueil des nouveaux étudiants avec photos et activités FSM.",
        type: "evenement",
        lien: "https://fsm.rnu.tn/"
      },
      {
        titre: "Appel à Candidature Mastères 2025/2026",
        description: "Dépôt des dossiers jusqu'au 24/07/2025 pour les formations en sciences.",
        type: "evenement",
        lien: "https://fsm.rnu.tn/fra/articles/4992/appel-a-candidature-aux-masteres-2025-2026"
      },
      {
        titre: "FJCC 2025 - Journées de Chimie Tunisiennes",
        description: "Conférence sur génie chimique avec professeurs de FSM.",
        type: "evenement",
        lien: "https://www.sctunisie.org/fjcc2025/FJCC2025-Proceedings.pdf"
      }
    ]
  };
  res.json(newsData);
});