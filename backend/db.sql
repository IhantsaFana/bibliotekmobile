-- Suppression de la base existante (attention : cela efface toutes les données)
DROP DATABASE IF EXISTS bibliotek;
CREATE DATABASE bibliotek;
USE bibliotek;

-- Table utilisateur (gestion des utilisateurs)
CREATE TABLE utilisateur (
    id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('Lecteur', 'Bibliothécaire', 'Administrateur') NOT NULL DEFAULT 'Lecteur',
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table ouvrage (on ne stocke que l'ISBN ; les autres informations seront récupérées via l'API)
CREATE TABLE ouvrage (
    id_ouvrage INT AUTO_INCREMENT PRIMARY KEY,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table reservation (gestion des réservations)
CREATE TABLE reservation (
    id_reservation INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    ouvrage_id INT NOT NULL,
    date_reservation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_retour_prevu DATE,
    statut ENUM('En attente', 'Confirmée', 'Annulée') NOT NULL DEFAULT 'En attente',
    CONSTRAINT fk_reservation_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_reservation_ouvrage FOREIGN KEY (ouvrage_id) REFERENCES ouvrage(id_ouvrage) ON DELETE CASCADE
);

-- Table emprunt (suivi des prêts effectifs)
CREATE TABLE emprunt (
    id_emprunt INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    ouvrage_id INT NOT NULL,
    date_emprunt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_retour_prevu DATE NOT NULL,
    date_retour_effective DATE,
    CONSTRAINT fk_emprunt_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_emprunt_ouvrage FOREIGN KEY (ouvrage_id) REFERENCES ouvrage(id_ouvrage) ON DELETE CASCADE
);

-- Table notification (pour envoyer des messages aux utilisateurs)
CREATE TABLE notification (
    id_notification INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    message TEXT NOT NULL,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_notification_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- Table penalite (gestion des pénalités en cas de retard ou d'infraction)
CREATE TABLE penalite (
    id_penalite INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT,
    montant DECIMAL(10,2) NOT NULL,
    date_penalite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('Non payé', 'Payé') NOT NULL DEFAULT 'Non payé',
    CONSTRAINT fk_penalite_reservation FOREIGN KEY (reservation_id) REFERENCES reservation(id_reservation) ON DELETE CASCADE
);

-- Table historique_emprunt (historique des prêts terminés)
CREATE TABLE historique_emprunt (
    id_historique INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    ouvrage_id INT NOT NULL,
    date_emprunt TIMESTAMP NOT NULL,
    date_retour_effective DATE NOT NULL,
    CONSTRAINT fk_historique_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_historique_ouvrage FOREIGN KEY (ouvrage_id) REFERENCES ouvrage(id_ouvrage) ON DELETE CASCADE
);

-- Table statistiques (pour collecter des indicateurs agrégés)
CREATE TABLE statistiques (
    id_stat INT AUTO_INCREMENT PRIMARY KEY,
    date_stat DATE NOT NULL,
    nombre_utilisateurs INT DEFAULT 0,
    nombre_reservations INT DEFAULT 0,
    nombre_emprunts INT DEFAULT 0,
    revenu_penalites DECIMAL(10,2) DEFAULT 0.00,
    UNIQUE KEY unique_date (date_stat)
);
