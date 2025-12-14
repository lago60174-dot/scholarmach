#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 ALGORITHME DE RECOMMANDATION HYBRIDE V2 - BOURSES D'ÉTUDES
Version améliorée avec scoring multicritères avancé, diversification et optimisations
"""

import sqlite3
from typing import List, Dict, Tuple, Optional, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from enum import Enum
import json
from collections import defaultdict
import math

# ============================================================================
# ÉNUMÉRATIONS ET CONSTANTES
# ============================================================================

class EducationLevel(Enum):
    """Niveaux d'études avec hiérarchie"""
    BACHELOR = ("Licence", 0)
    MASTER = ("Master", 1)
    DOCTORATE = ("Doctorat", 2)
    POSTDOC = ("Post-doctorat", 3)

class ScholarshipType(Enum):
    """Types de bourses"""
    FULL = "Complète"
    PARTIAL = "Partielle"
    MERIT = "Mérite"
    NEED = "Besoin"

# ============================================================================
# DICTIONNAIRES D'AMÉLIORATION - DONNÉES GÉOGRAPHIQUES ET DOMAINES
# ============================================================================

# Mappings de régions géographiques
REGIONS = {
    'europe': {
        'countries': [
            'france', 'allemagne', 'royaume-uni', 'suisse', 'pays-bas', 'belgique',
            'suede', 'norvege', 'danemark', 'espagne', 'italie', 'portugal', 'grece',
            'autriche', 'pologne', 'republique tcheque', 'hongrie', 'roumanie',
            'bulgarie', 'croatie', 'slovenie', 'slovaquie', 'luxembourg', 'malte',
            'chypre', 'finlande', 'irlande', 'lettonie', 'lituanie', 'estonie'
        ],
        'continent': 'Europe'
    },
    'asie_du_sud_est': {
        'countries': [
            'vietnam', 'thaïlande', 'cambodge', 'laos', 'malaisie', 'singapour',
            'indonésie', 'philippines', 'birmanie', 'brunei'
        ],
        'continent': 'Asie'
    },
    'asie_du_sud': {
        'countries': ['inde', 'pakistan', 'bangladesh', 'nepal', 'sri_lanka', 'afghanistan'],
        'continent': 'Asie'
    },
    'asie_centrale': {
        'countries': ['kazakhstan', 'ouzbekistan', 'turkmenistan', 'tadjikistan', 'kirghizstan'],
        'continent': 'Asie'
    },
    'asie_de_l_est': {
        'countries': [
            'japon', 'chine', 'corée_du_sud', 'corée_du_nord', 'mongolie',
            'taiwan', 'hongkong', 'macao'
        ],
        'continent': 'Asie'
    },
    'moyen_orient': {
        'countries': [
            'arabie_saoudite', 'iran', 'irak', 'israel', 'palestine', 'liban',
            'syrie', 'jordanie', 'yemen', 'oman', 'emirats_arabes_unis',
            'qatar', 'bahrein', 'koweït', 'turquie'
        ],
        'continent': 'Asie'
    },
    'afrique_du_nord': {
        'countries': ['maroc', 'algerie', 'tunisie', 'libye', 'égypte', 'soudan'],
        'continent': 'Afrique'
    },
    'afrique_subsaharienne': {
        'countries': [
            'afrique_du_sud', 'kenya', 'nigeria', 'ghana', 'senegal', 'ethiopie',
            'cameroun', 'congo', 'tanzanie', 'uganda', 'malawi', 'zambie',
            'zimbabwe', 'mozambique', 'botswana', 'namibie', 'mauritius'
        ],
        'continent': 'Afrique'
    },
    'amerique_du_nord': {
        'countries': ['usa', 'états-unis', 'canada', 'mexique'],
        'continent': 'Amérique du Nord'
    },
    'amerique_centrale': {
        'countries': [
            'guatemala', 'honduras', 'salvador', 'nicaragua', 'costa_rica',
            'panama', 'belize'
        ],
        'continent': 'Amérique Centrale'
    },
    'amerique_du_sud': {
        'countries': [
            'colombie', 'venezuela', 'guyana', 'surinam', 'brésil', 'pérou',
            'bolivie', 'chili', 'argentine', 'uruguay', 'paraguay', 'équateur'
        ],
        'continent': 'Amérique du Sud'
    },
    'oceanie': {
        'countries': [
            'australie', 'nouvelle-zélande', 'fidji', 'samoa', 'vanuatu',
            'tonga', 'kiribati', 'marshall'
        ],
        'continent': 'Océanie'
    }
}

# Catégories de domaines et synonymes
FIELD_CATEGORIES = {
    'informatique': [
        'computer science', 'cs', 'software', 'programmation', 'coding',
        'développement', 'data science', 'ia', 'machine learning', 'ai',
        'cybersécurité', 'network', 'web development', 'développement web'
    ],
    'ingénierie': [
        'engineering', 'génie', 'civil', 'mécanique', 'électrique',
        'électronique', 'aéronautique', 'chimie', 'matériaux', 'géotechnique'
    ],
    'santé': [
        'médecine', 'medicine', 'nursing', 'infirmerie', 'pharmacie',
        'pharmacy', 'dentaire', 'dentistry', 'psychologie', 'psychology',
        'santé publique', 'public health'
    ],
    'sciences': [
        'physique', 'physics', 'chimie', 'biologie', 'biology', 'mathématiques',
        'mathematics', 'géologie', 'astronomie', 'environnement'
    ],
    'commerce': [
        'business', 'économie', 'economics', 'finance', 'accounting',
        'comptabilité', 'management', 'marketing', 'mba', 'gestion'
    ],
    'droit': [
        'law', 'droit', 'jurisprudence', 'légal', 'international_law',
        'droit_international', 'constitutionnel'
    ],
    'arts': [
        'art', 'design', 'musique', 'music', 'théâtre', 'dance', 'film',
        'cinéma', 'photographie', 'architecture', 'beaux-arts'
    ],
    'humaines': [
        'philosophie', 'histoire', 'littérature', 'langue', 'linguistics',
        'sociologie', 'anthropologie', 'géographie', 'sciences_humaines'
    ],
    'éducation': [
        'education', 'enseignement', 'pédagogie', 'formation', 'training'
    ]
}

# Langues supportées et variantes
LANGUAGE_VARIANTS = {
    'français': ['fr', 'french', 'fra'],
    'anglais': ['en', 'english', 'eng'],
    'espagnol': ['es', 'spanish', 'esp'],
    'allemand': ['de', 'german', 'deu'],
    'chinois': ['zh', 'chinese', 'zho', 'mandarin'],
    'japonais': ['ja', 'japanese', 'jpn'],
    'arabe': ['ar', 'arabic', 'ara'],
    'russe': ['ru', 'russian', 'rus'],
    'portugais': ['pt', 'portuguese', 'por']
}

# Hiérarchie des niveaux (important pour matching flexible)
LEVEL_HIERARCHY = {
    'licence': 0, 'bachelor': 0, 'undergrad': 0, 'bac+3': 0,
    'master': 1, 'maitrise': 1, 'msc': 1, 'ma': 1, 'bac+5': 1,
    'doctorat': 2, 'phd': 2, 'doctorate': 2, 'bac+8': 2,
    'post-doctorat': 3, 'postdoc': 3, 'post-doc': 3
}

# Poids des critères (V2 - optimisés)
WEIGHTS_V2 = {
    'country_match': 0.28,        # 28% - Pays (augmenté)
    'field_match': 0.22,          # 22% - Domaine (augmenté)
    'level_match': 0.18,          # 18% - Niveau
    'type_match': 0.10,           # 10% - Type
    'origin_bonus': 0.08,         # 8% - Origine
    'language_match': 0.08,       # 8% - Langue
    'gpa_match': 0.06,            # 6% - GPA (réduit)
}

# Sélectivité des bourses (estimée)
SCHOLARSHIP_SELECTIVITY = {
    'très_sélective': {'gpa_min': 3.7, 'multiplier': 1.0},
    'sélective': {'gpa_min': 3.3, 'multiplier': 0.85},
    'modérée': {'gpa_min': 3.0, 'multiplier': 0.7},
    'accessible': {'gpa_min': 2.5, 'multiplier': 0.5}
}

# ============================================================================
# CLASSES DE DONNÉES (AMÉLIORÉES)
# ============================================================================

@dataclass
class UserProfile:
    """Profil utilisateur enrichi"""
    user_id: str
    email: str
    full_name: str
    age: Optional[int]
    origin_country: str
    target_country: str
    field_of_study: str
    education_level: str
    gpa: Optional[float]
    preferred_language: str = 'fr'
    scholarship_type: Optional[str] = None
    finance_type: Optional[str] = None
    
    @classmethod
    def from_dict(cls, data: Dict):
        """Créer depuis un dictionnaire"""
        return cls(
            user_id=data.get('id'),
            email=data.get('email'),
            full_name=data.get('full_name'),
            age=data.get('age'),
            origin_country=data.get('origin_country'),
            target_country=data.get('target_country'),
            field_of_study=data.get('field_of_study'),
            education_level=data.get('education_level'),
            gpa=data.get('gpa'),
            preferred_language=data.get('preferred_language', 'fr'),
            scholarship_type=data.get('scholarship_type'),
            finance_type=data.get('finance_type')
        )

@dataclass
class Scholarship:
    """Bourse d'études enrichie"""
    id: int
    titre: str
    description: str
    pays: str
    pays_cibles: str
    domaine_etude: str
    niveau_etude: str
    type_bourse: str
    date_limite: str
    montant: str
    devise: str
    lien_candidature: str
    
    @classmethod
    def from_tuple(cls, t: Tuple):
        """Créer depuis un tuple"""
        return cls(
            id=t[0],
            titre=t[1],
            description=t[2],
            pays=t[3],
            pays_cibles=t[4],
            domaine_etude=t[5],
            niveau_etude=t[6],
            type_bourse=t[7],
            date_limite=t[8],
            montant=t[9],
            devise=t[10],
            lien_candidature=t[11] if len(t) > 11 else ""
        )

@dataclass
class ComponentScore:
    """Score détaillé par composant"""
    name: str
    score: float
    max_score: float = 1.0
    percentage: float = field(init=False)
    
    def __post_init__(self):
        self.percentage = (self.score / self.max_score) * 100 if self.max_score > 0 else 0

@dataclass
class RecommendationScore:
    """Score de recommandation enrichi"""
    scholarship_id: int
    titre: str
    montant: str
    pays: str
    overall_score: float
    match_percentage: float
    component_scores: Dict[str, float]
    reasons: List[str] = field(default_factory=list)
    deadline_status: str = "ouvert"
    days_until_deadline: Optional[int] = None
    
    def to_dict(self) -> Dict:
        """Convertir en dictionnaire JSON-friendly"""
        return {
            'id': self.scholarship_id,
            'titre': self.titre,
            'montant': self.montant,
            'pays': self.pays,
            'score_overall': round(self.overall_score, 3),
            'match_percentage': round(self.match_percentage, 1),
            'scores_composants': {k: round(v, 3) for k, v in self.component_scores.items()},
            'raisons': self.reasons,
            'deadline_status': self.deadline_status,
            'days_until_deadline': self.days_until_deadline
        }
    
    def to_json(self) -> str:
        """Convertir en JSON"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)

# ============================================================================
# MOTEUR DE RECOMMANDATION HYBRIDE V2
# ============================================================================

class HybridRecommendationEngineV2:
    """
    Moteur de recommandation hybride avancé V2 avec:
    ✅ Scoring multicritères optimisé
    ✅ Matching intelligent (fuzzy, hiérarchie, régions)
    ✅ Diversification des résultats
    ✅ Optimisations de performance
    ✅ Explications détaillées et claires
    ✅ Gestion intelligente des deadlines
    """
    
    def __init__(self, db_file: str = 'scholarships.db'):
        self.db_file = db_file
        self.conn = sqlite3.connect(db_file)
        self.conn.row_factory = sqlite3.Row
        
        # Caches pour optimisation
        self.scholarships_cache: Optional[List[Scholarship]] = None
        self.countries_cache: Set[str] = set()
        self.fields_cache: Set[str] = set()
        self.levels_cache: Set[str] = set()
        
        self._prepare_data()
    
    def _prepare_data(self):
        """Préparer et indexer les données"""
        cursor = self.conn.cursor()
        
        # Cache des pays
        cursor.execute("SELECT DISTINCT pays FROM scholarship")
        self.countries_cache = {row[0].lower() for row in cursor.fetchall() if row[0]}
        
        # Cache des domaines
        cursor.execute("SELECT DISTINCT domaine_etude FROM scholarship")
        self.fields_cache = {row[0].lower() for row in cursor.fetchall() if row[0]}
        
        # Cache des niveaux
        cursor.execute("SELECT DISTINCT niveau_etude FROM scholarship")
        self.levels_cache = {row[0].lower() for row in cursor.fetchall() if row[0]}
    
    def recommend(self, user_profile: UserProfile, top_n: int = 10,
                 min_score: float = 0.15, diversify: bool = True) -> List[RecommendationScore]:
        """
        Générer les recommandations optimales pour un utilisateur
        
        Args:
            user_profile: Profil de l'utilisateur
            top_n: Nombre de recommandations à retourner (défaut 10)
            min_score: Score minimum accepté (0-1), par défaut 0.15 pour 10 résultats
            diversify: Appliquer diversification pays/domaine
        
        Returns:
            Liste de exactement top_n recommandations (même si scores faibles)
        """
        
        # 1. Récupérer toutes les bourses
        scholarships = self._get_all_scholarships()
        
        if not scholarships:
            return []
        
        # 2. Scorer chaque bourse
        recommendations = []
        for scholarship in scholarships:
            score = self._calculate_score(user_profile, scholarship)
            recommendations.append(score)
        
        # 3. Trier par score descendant
        recommendations.sort(key=lambda x: x.overall_score, reverse=True)
        
        # 4. Appliquer diversification si demandée
        if diversify and len(recommendations) > top_n:
            recommendations = self._diversify_results(recommendations, top_n)
        else:
            # Prendre simplement les top N
            recommendations = recommendations[:top_n]
        
        # 5. Compléter jusqu'à top_n si besoin (avec bourses de score faible)
        if len(recommendations) < top_n:
            all_recommendations = self._get_all_scholarships()
            cursor = self.conn.cursor()
            cursor.execute("SELECT * FROM scholarship")
            all_scholarships = [Scholarship.from_tuple(row) for row in cursor.fetchall()]
            
            for scholarship in all_scholarships:
                if len(recommendations) >= top_n:
                    break
                # Vérifier que la bourse n'est pas déjà présente
                if not any(r.scholarship_id == scholarship.id for r in recommendations):
                    score = self._calculate_score(user_profile, scholarship)
                    recommendations.append(score)
        
        return recommendations[:top_n]
    
    def _diversify_results(self, recommendations: List[RecommendationScore],
                          top_n: int) -> List[RecommendationScore]:
        """
        Diversifier les résultats pour éviter redondance
        Stratégie: favoriser différents pays et domaines
        """
        diverse = []
        countries_used = set()
        
        # Passer 1: Ajouter les meilleurs de chaque pays
        for rec in recommendations:
            if rec.pays.lower() not in countries_used and len(diverse) < top_n:
                diverse.append(rec)
                countries_used.add(rec.pays.lower())
        
        # Passe 2: Compléter avec les meilleurs restants
        for rec in recommendations:
            if len(diverse) >= top_n:
                break
            if rec not in diverse:
                diverse.append(rec)
        
        return diverse[:top_n]
    
    def _get_all_scholarships(self) -> List[Scholarship]:
        """Récupérer toutes les bourses (avec cache)"""
        if self.scholarships_cache is not None:
            return self.scholarships_cache
        
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM scholarship")
        self.scholarships_cache = [Scholarship.from_tuple(row) for row in cursor.fetchall()]
        return self.scholarships_cache
    
    def _calculate_score(self, user: UserProfile, scholarship: Scholarship) -> RecommendationScore:
        """
        Calculer le score de recommandation multicritères V2
        
        Critères pondérés:
        28% Pays | 22% Domaine | 18% Niveau | 10% Type | 8% Origine | 8% Langue | 6% GPA
        """
        
        component_scores = {}
        reasons = []
        
        # ===== CRITÈRE 1: PAYS (28%) =====
        country_score = self._score_country_match_v2(user, scholarship)
        component_scores['pays'] = country_score
        
        if country_score >= 0.95:
            reasons.append(f"✅ Destiné pour {scholarship.pays} - Match exact")
        elif country_score >= 0.80:
            reasons.append(f"✅ Accepte votre destination ({scholarship.pays})")
        elif country_score >= 0.60:
            reasons.append(f"⚠️  Ouvert à votre région")
        elif country_score >= 0.30:
            reasons.append("📍 Bourse générale multi-régionale")
        
        # ===== CRITÈRE 2: DOMAINE (22%) =====
        field_score = self._score_field_match_v2(user, scholarship)
        component_scores['domaine'] = field_score
        
        if field_score >= 0.95:
            reasons.append(f"✅ {user.field_of_study} - Correspondance parfaite")
        elif field_score >= 0.75:
            reasons.append(f"✅ {scholarship.domaine_etude} correspond à votre domaine")
        elif field_score >= 0.50:
            reasons.append("✅ Domaine compatible")
        
        # ===== CRITÈRE 3: NIVEAU (18%) =====
        level_score = self._score_level_match_v2(user, scholarship)
        component_scores['niveau'] = level_score
        
        if level_score >= 0.95:
            reasons.append(f"✅ {scholarship.niveau_etude} - Niveau exact")
        elif level_score >= 0.75:
            reasons.append(f"✅ {scholarship.niveau_etude} accepté pour votre niveau")
        elif level_score >= 0.50:
            reasons.append("⚠️  Niveau compatible")
        
        # ===== CRITÈRE 4: TYPE (10%) =====
        type_score = self._score_type_match_v2(user, scholarship)
        component_scores['type'] = type_score
        
        if type_score >= 0.90:
            reasons.append(f"✅ {scholarship.type_bourse} - Exactement ce que vous cherchez")
        elif type_score >= 0.60:
            reasons.append(f"✅ Type {scholarship.type_bourse} disponible")
        
        # ===== CRITÈRE 5: PAYS D'ORIGINE (8%) =====
        origin_score = self._score_origin_bonus_v2(user, scholarship)
        component_scores['origine'] = origin_score
        
        if origin_score >= 0.85:
            reasons.append(f"🌍 Spécialisée pour les ressortissants de {user.origin_country}")
        elif origin_score >= 0.50:
            reasons.append(f"🌍 Accepte votre région (origine {user.origin_country})")
        
        # ===== CRITÈRE 6: LANGUE (8%) =====
        language_score = self._score_language_match_v2(user, scholarship)
        component_scores['langue'] = language_score
        
        if language_score >= 0.85:
            reasons.append(f"🗣️  Entièrement en {user.preferred_language}")
        elif language_score >= 0.60:
            reasons.append(f"🗣️  Disponible en {user.preferred_language}")
        elif language_score >= 0.35:
            reasons.append("🗣️  Langues internationales supportées")
        
        # ===== CRITÈRE 7: GPA (6%) =====
        gpa_score = self._score_gpa_match_v2(user, scholarship)
        component_scores['gpa'] = gpa_score
        
        if gpa_score >= 0.90:
            reasons.append(f"📊 Votre GPA {user.gpa} surpasse les exigences")
        elif gpa_score >= 0.70:
            reasons.append(f"📊 GPA {user.gpa} correspond aux critères")
        elif gpa_score >= 0.40:
            reasons.append("📊 GPA acceptable pour cette bourse")
        
        # ===== GESTION DES DEADLINES =====
        deadline_status, days_left, deadline_boost = self._analyze_deadline(scholarship.date_limite)
        
        if deadline_status == "urgent":
            reasons.append(f"⏰ URGENT: {days_left} jours avant fermeture")
            deadline_boost = 0.10  # +10% boost
        elif deadline_status == "proche":
            reasons.append(f"⏰ Deadline dans {days_left} jours - À prévoir")
            deadline_boost = 0.05  # +5% boost
        elif deadline_status == "fermé":
            deadline_boost = -0.50  # -50% malus
        else:
            deadline_boost = 0.0
        
        # ===== CALCUL DU SCORE PONDÉRÉ =====
        overall_score = (
            component_scores['pays'] * WEIGHTS_V2['country_match'] +
            component_scores['domaine'] * WEIGHTS_V2['field_match'] +
            component_scores['niveau'] * WEIGHTS_V2['level_match'] +
            component_scores['type'] * WEIGHTS_V2['type_match'] +
            component_scores['origine'] * WEIGHTS_V2['origin_bonus'] +
            component_scores['langue'] * WEIGHTS_V2['language_match'] +
            component_scores['gpa'] * WEIGHTS_V2['gpa_match']
        )
        
        # Appliquer boost deadline
        overall_score = max(0, min(1, overall_score * (1 + deadline_boost)))
        
        # Match percentage
        match_percentage = overall_score * 100
        
        return RecommendationScore(
            scholarship_id=scholarship.id,
            titre=scholarship.titre,
            montant=scholarship.montant,
            pays=scholarship.pays,
            overall_score=overall_score,
            match_percentage=match_percentage,
            component_scores=component_scores,
            reasons=reasons,
            deadline_status=deadline_status,
            days_until_deadline=days_left
        )
    
    # =========================================================================
    # MÉTHODES DE SCORING AVANCÉES V2
    # =========================================================================
    
    def _score_country_match_v2(self, user: UserProfile, scholarship: Scholarship) -> float:
        """
        Scoring pays V2 amélioré:
        - Match exact (1.0)
        - Match dans pays cibles (0.95)
        - Monde ouvert (0.70)
        - Même région (0.60)
        - Même continent (0.40)
        - Autre (0.10)
        """
        user_country = user.target_country.lower().strip()
        scholarship_country = scholarship.pays.lower().strip()
        scholarship_targets = scholarship.pays_cibles.lower().strip()
        
        # Match exact du pays
        if user_country == scholarship_country:
            return 1.0
        
        # Match dans la liste des pays cibles
        targets_list = [c.strip() for c in scholarship_targets.replace(';', ',').split(',')]
        if any(user_country in target or target in user_country for target in targets_list):
            return 0.95
        
        # Monde ouvert
        world_keywords = ['monde', 'all', 'international', 'anywhere', 'partout']
        if any(kw in scholarship_targets for kw in world_keywords):
            return 0.70
        
        # Match par région
        user_region = self._get_region(user_country)
        scholarship_region = self._get_region(scholarship_country)
        
        if user_region and scholarship_region:
            if user_region == scholarship_region:
                return 0.60
            # Même continent
            if REGIONS.get(user_region, {}).get('continent') == \
               REGIONS.get(scholarship_region, {}).get('continent'):
                return 0.40
        
        # Check if scholarship targets the user's region
        for region_name, region_data in REGIONS.items():
            if any(c in scholarship_targets for c in region_data['countries']):
                if user_region == region_name:
                    return 0.65
        
        return 0.10
    
    def _score_field_match_v2(self, user: UserProfile, scholarship: Scholarship) -> float:
        """
        Scoring domaine V2 amélioré:
        - Match exact (1.0)
        - Match catégorie (0.90)
        - Substring/synonyme (0.75)
        - Domaine ouvert (0.60)
        """
        user_field = user.field_of_study.lower().strip()
        scholarship_field = scholarship.domaine_etude.lower().strip()
        
        # Match exact
        if user_field == scholarship_field:
            return 1.0
        
        # Substring match
        if user_field in scholarship_field or scholarship_field in user_field:
            return 0.92
        
        # Check if in same category
        user_category = self._get_field_category(user_field)
        scholarship_category = self._get_field_category(scholarship_field)
        
        if user_category and scholarship_category == user_category:
            return 0.85
        
        # Check synonymes dans la catégorie
        for category, synonyms in FIELD_CATEGORIES.items():
            if any(syn in user_field for syn in synonyms) and \
               any(syn in scholarship_field for syn in synonyms):
                return 0.78
        
        # Tous les domaines
        open_keywords = ['tous', 'all', 'any', 'toutes']
        if any(kw in scholarship_field for kw in open_keywords):
            return 0.60
        
        # Word similarity
        user_words = set(user_field.split())
        scholarship_words = set(scholarship_field.split())
        if user_words & scholarship_words:
            intersection = len(user_words & scholarship_words)
            union = len(user_words | scholarship_words)
            return 0.50 + (intersection / union if union > 0 else 0) * 0.30
        
        return 0.10
    
    def _score_level_match_v2(self, user: UserProfile, scholarship: Scholarship) -> float:
        """
        Scoring niveau V2 avec hiérarchie stricte:
        - Match exact (1.0)
        - Niveau accepté dans fourchette (0.95)
        - Niveau inférieur accepté (0.80)
        - Niveau supérieur accepté (0.60)
        """
        user_level = user.education_level.lower().strip()
        scholarship_level = scholarship.niveau_etude.lower().strip()
        
        # Get hierarchical values
        user_level_value = self._get_level_value(user_level)
        scholarship_level_values = self._get_level_values(scholarship_level)
        
        if user_level_value is None or not scholarship_level_values:
            return 0.50
        
        # Match exact
        if user_level_value in scholarship_level_values:
            return 1.0
        
        # Niveau inférieur accepté (fourchette)
        min_level = min(scholarship_level_values)
        max_level = max(scholarship_level_values)
        
        if min_level <= user_level_value <= max_level:
            return 0.95
        
        # Niveau inférieur à la fourchette mais proche
        if user_level_value < min_level and (min_level - user_level_value) == 1:
            return 0.80
        
        # Niveau supérieur à la fourchette
        if user_level_value > max_level and (user_level_value - max_level) == 1:
            return 0.60
        
        # Tous les niveaux
        if 'tous' in scholarship_level or 'all' in scholarship_level:
            return 0.70
        
        return 0.20
    
    def _score_type_match_v2(self, user: UserProfile, scholarship: Scholarship) -> float:
        """
        Scoring type de bourse V2:
        - Match exact (1.0)
        - Type acceptable (0.75)
        - Type générique (0.50)
        """
        if not user.scholarship_type:
            return 0.65  # Pas de préférence
        
        user_type = user.scholarship_type.lower().strip()
        scholarship_type = scholarship.type_bourse.lower().strip()
        
        # Match exact
        if user_type in scholarship_type or scholarship_type in user_type:
            return 1.0
        
        # Mapping entre les préférences
        type_mapping = {
            'complète': ['full', 'complet', 'intégrale'],
            'partielle': ['partial', 'partiell'],
            'mérite': ['merit', 'excellence', 'académique'],
            'besoin': ['need', 'besoin', 'financier', 'ressources']
        }
        
        for pref_type, variations in type_mapping.items():
            if user_type in pref_type or pref_type in user_type:
                if any(v in scholarship_type for v in variations):
                    return 0.85
        
        # Bourse complète est meilleure que partielle
        if 'complet' in scholarship_type and user_type in ['complète', 'full']:
            return 0.90
        
        return 0.50
    
    def _score_origin_bonus_v2(self, user: UserProfile, scholarship: Scholarship) -> float:
        """
        Scoring pays d'origine V2 avec régions:
        - Cible spécifique du pays (1.0)
        - Même région (0.75)
        - Même continent (0.50)
        - Autre (0.0)
        """
        user_origin = user.origin_country.lower().strip()
        scholarship_targets = scholarship.pays_cibles.lower().strip()
        scholarship_country = scholarship.pays.lower().strip()
        
        # Match exact du pays d'origine dans les cibles
        if user_origin in scholarship_targets or \
           (user_origin in scholarship_country and scholarship_country in scholarship_targets):
            return 1.0
        
        # Check if same region
        user_region = self._get_region(user_origin)
        scholarship_region = self._get_region(scholarship_country)
        
        if user_region and scholarship_region == user_region:
            # Check if scholarship targets this region
            region_data = REGIONS.get(user_region, {})
            if any(c in scholarship_targets for c in region_data.get('countries', [])):
                return 0.80
        
        # Same continent
        if user_region and scholarship_region:
            user_continent = REGIONS.get(user_region, {}).get('continent')
            scholarship_continent = REGIONS.get(scholarship_region, {}).get('continent')
            
            if user_continent and user_continent == scholarship_continent:
                return 0.50
        
        # Monde ouvert accepte toute origine
        if 'monde' in scholarship_targets or 'all' in scholarship_targets:
            return 0.40
        
        return 0.0
    
    def _score_language_match_v2(self, user: UserProfile, scholarship: Scholarship) -> float:
        """
        Scoring langue V2 avec détection multi-niveaux:
        - Langue exacte (1.0)
        - Langue acceptée (0.80)
        - Langue générale (0.50)
        """
        user_lang = user.preferred_language.lower().strip()
        # Assume scholarship description contains language info (pour test)
        # En production, ajouter champ 'languages' à Scholarship
        
        # Chercher langue dans description/titre
        scholarship_text = (scholarship.titre + " " + scholarship.description).lower()
        
        # Get all variant for user's language
        for lang, variants in LANGUAGE_VARIANTS.items():
            if user_lang in lang or user_lang in variants:
                # Check if scholarship mentions this language
                if user_lang in scholarship_text or \
                   any(v in scholarship_text for v in variants):
                    return 1.0
                else:
                    # Default pour pays anglophone
                    if 'usa' in scholarship.pays.lower() or 'uk' in scholarship.pays.lower():
                        if user_lang == 'en' or user_lang == 'anglais':
                            return 0.90
                    # Assumer français si pays francophone
                    if 'france' in scholarship.pays.lower():
                        if user_lang == 'fr' or user_lang == 'français':
                            return 0.90
        
        # International/multilingual
        if any(kw in scholarship_text for kw in ['international', 'multilingual', 'multiple languages']):
            return 0.70
        
        # Default
        if user_lang == 'en' or user_lang == 'english':
            return 0.60  # Beaucoup de bourses sont en anglais
        
        return 0.40
    
    def _score_gpa_match_v2(self, user: UserProfile, scholarship: Scholarship) -> float:
        """
        Scoring GPA V2 avec sélectivité réaliste:
        - Dépasse exigences (1.0)
        - Conforme exigences (0.85)
        - Minimum acceptable (0.60)
        - Autre (0.30)
        """
        if not user.gpa:
            return 0.65  # GPA non fourni = moyenne
        
        # Estimer sélectivité de la bourse (simplifié)
        # En production, avoir champ 'selectivity' dans DB
        scholarship_text = (scholarship.titre + " " + scholarship.domaine_etude).lower()
        
        selectivity = 'modérée'
        if any(kw in scholarship_text for kw in ['excellence', 'prestigious', 'prestig', 'top']):
            selectivity = 'très_sélective'
        elif any(kw in scholarship_text for kw in ['advanced', 'competitive', 'master', 'phd']):
            selectivity = 'sélective'
        elif any(kw in scholarship_text for kw in ['accessible', 'open', 'ouvert', 'besoin']):
            selectivity = 'accessible'
        
        gpa_req = SCHOLARSHIP_SELECTIVITY[selectivity]
        gpa_min = gpa_req['gpa_min']
        
        if user.gpa >= gpa_min + 0.5:
            return 1.0  # Dépasse nettement
        elif user.gpa >= gpa_min:
            return 0.85  # Conforme
        elif user.gpa >= gpa_min - 0.3:
            return 0.65  # Limite basse mais possible
        elif user.gpa >= gpa_min - 0.5:
            return 0.45  # Risqué
        else:
            return 0.20  # Peu probable
    
    def _analyze_deadline(self, deadline_str: str) -> Tuple[str, Optional[int], float]:
        """
        Analyser le statut de la deadline
        Retourne: (status, days_left, boost)
        - 'urgent': < 7 jours (+10%)
        - 'proche': 7-30 jours (+5%)
        - 'ouvert': > 30 jours (0%)
        - 'fermé': date passée (-50%)
        """
        try:
            deadline_date = datetime.strptime(deadline_str, '%Y-%m-%d')
            days_left = (deadline_date - datetime.now()).days
            
            if days_left < 0:
                return 'fermé', 0, -0.50
            elif days_left <= 7:
                return 'urgent', days_left, 0.10
            elif days_left <= 30:
                return 'proche', days_left, 0.05
            else:
                return 'ouvert', days_left, 0.0
        except:
            return 'inconnu', None, 0.0
    
    # =========================================================================
    # MÉTHODES UTILITAIRES D'ANALYSE
    # =========================================================================
    
    def _get_region(self, country: str) -> Optional[str]:
        """Obtenir la région d'un pays"""
        country = country.lower().strip()
        for region_name, region_data in REGIONS.items():
            if any(c in country for c in region_data['countries']):
                return region_name
        return None
    
    def _get_field_category(self, field: str) -> Optional[str]:
        """Obtenir la catégorie d'un domaine"""
        field = field.lower().strip()
        for category, synonyms in FIELD_CATEGORIES.items():
            if field in synonyms or any(syn in field for syn in synonyms):
                return category
        return None
    
    def _get_level_value(self, level: str) -> Optional[int]:
        """Obtenir la valeur hiérarchique d'un niveau"""
        level = level.lower().strip()
        for key, value in LEVEL_HIERARCHY.items():
            if key in level or level in key:
                return value
        return None
    
    def _get_level_values(self, level_str: str) -> List[int]:
        """Obtenir les valeurs hiérarchiques possibles"""
        level_str = level_str.lower().strip()
        values = []
        for key, value in LEVEL_HIERARCHY.items():
            if key in level_str or level_str in key:
                if value not in values:
                    values.append(value)
        return sorted(values) if values else []
    
    def __del__(self):
        """Fermer la connexion"""
        if self.conn:
            self.conn.close()


# ============================================================================
# DEMO ET TESTS V2
# ============================================================================

def demo_v2():
    """Démonstration du moteur V2"""
    
    print("\n" + "=" * 100)
    print("🚀 MOTEUR DE RECOMMANDATION HYBRIDE V2 - DÉMONSTRATION AMÉLIORÉE")
    print("=" * 100 + "\n")
    
    try:
        # Créer le moteur
        engine = HybridRecommendationEngineV2()
        
        # Profil utilisateur exemple
        user_data = {
            'id': 'user-v2-123',
            'email': 'student@v2.example.com',
            'full_name': 'Marie Dupont',
            'age': 25,
            'origin_country': 'France',
            'target_country': 'États-Unis',
            'field_of_study': 'Data Science',
            'education_level': 'Master',
            'gpa': 3.8,
            'preferred_language': 'anglais',
            'scholarship_type': 'Complète',
            'finance_type': 'Mérite'
        }
        
        user = UserProfile.from_dict(user_data)
        
        print(f"👤 PROFIL UTILISATEUR")
        print("-" * 100)
        print(f"   Nom: {user.full_name}")
        print(f"   Origine: {user.origin_country} → Destination: {user.target_country}")
        print(f"   Domaine: {user.field_of_study}")
        print(f"   Niveau: {user.education_level} | GPA: {user.gpa}")
        print(f"   Langue: {user.preferred_language} | Type: {user.scholarship_type}")
        print()
        
        # Générer les recommandations
        print("🔍 CALCUL DES RECOMMANDATIONS...")
        recommendations = engine.recommend(user, top_n=10, min_score=0.15)
        
        print(f"\n📊 RÉSULTATS ({len(recommendations)} bourses retournées)\n")
        print("-" * 100)
        
        for idx, rec in enumerate(recommendations, 1):
            print(f"\n{idx}. {rec.titre}")
            print(f"   {'═' * 96}")
            print(f"   🎯 SCORE: {rec.match_percentage:.1f}% | Valeur: {rec.overall_score:.3f}")
            print(f"   📍 Pays: {rec.pays}")
            print(f"   💰 Montant: {rec.montant}")
            print(f"   ⏰ Deadline: {rec.deadline_status.upper()}" +
                  (f" ({rec.days_until_deadline} jours)" if rec.days_until_deadline else ""))
            print()
            print(f"   Scores détaillés:")
            for criteria, score in rec.component_scores.items():
                percentage = score * 100
                bar_length = int(percentage / 5)
                bar = "█" * bar_length + "░" * (20 - bar_length)
                print(f"      {criteria:10} │{bar}│ {percentage:5.1f}% ({score:.2f})")
            print()
            print(f"   Raisons du match:")
            for reason in rec.reasons:
                print(f"      • {reason}")
            print()
        
        print("-" * 100)
        print(f"\n✅ Recommandations complétées le {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print()
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    demo_v2()
