-- Activer et valider toutes les bourses existantes
UPDATE bourse 
SET est_validee = true, 
    est_active = true 
WHERE est_validee = false OR est_active = false;