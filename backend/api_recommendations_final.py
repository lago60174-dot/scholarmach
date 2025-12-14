#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 API RECOMMANDATION HYBRIDE V2+ - INTÉGRATION COMPLÈTE SUPABASE
Fusion optimale du moteur V2 avancé avec infrastructure FastAPI/Supabase
- Scoring multicritères avancé (7 critères pondérés V2)
- MAX 10 bourses par recommandation (limite stricte)
- Diversification intelligente des résultats
- Boost deadline intelligent
- Cache 1h optimisé
- Prêt pour React + TypeScript frontend
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Tuple, Set
from enum import Enum
from dataclasses import dataclass, field, asdict
import os
from datetime import datetime, timedelta
import logging
from supabase import create_client, Client
import json
import math
from collections import defaultdict
import time

# ==========================================
# CONFIGURATION LOGGING
# ==========================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==========================================
# ÉNUMÉRATIONS
# ==========================================

class EducationLevel(str, Enum):
    """Niveaux d'études avec hiérarchie"""
    BACHELOR = "Licence"
    MASTER = "Master"
    DOCTORATE = "Doctorat"
    POSTDOC = "Post-doctorat"

class ScholarshipType(str, Enum):
    """Types de bourses"""
    FULL = "Complète"
    PARTIAL = "Partielle"
    MERIT = "Mérite"
    NEED = "Besoin"

# ==========================================
# DICTIONNAIRES DONNÉES V2 - RÉGIONS & DOMAINES
# ==========================================

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

LEVEL_HIERARCHY = {
    'licence': 0, 'bachelor': 0, 'undergrad': 0, 'bac+3': 0,
    'master': 1, 'maitrise': 1, 'msc': 1, 'ma': 1, 'bac+5': 1,
    'doctorat': 2, 'phd': 2, 'doctorate': 2, 'bac+8': 2,
    'post-doctorat': 3, 'postdoc': 3, 'post-doc': 3
}

# Poids V2 optimisés
WEIGHTS_V2 = {
    'country_match': 0.28,
    'field_match': 0.22,
    'level_match': 0.18,
    'type_match': 0.10,
    'origin_bonus': 0.08,
    'language_match': 0.08,
    'gpa_match': 0.06,
}

SCHOLARSHIP_SELECTIVITY = {
    'très_sélective': {'gpa_min': 3.7, 'multiplier': 1.0},
    'sélective': {'gpa_min': 3.3, 'multiplier': 0.85},
    'modérée': {'gpa_min': 3.0, 'multiplier': 0.7},
    'accessible': {'gpa_min': 2.5, 'multiplier': 0.5}
}

# ==========================================
# MODÈLES PYDANTIC
# ==========================================

class UserProfileRequest(BaseModel):
    """Profil utilisateur"""
    full_name: str
    age: Optional[int] = None
    origin_country: str
    target_country: str
    field_of_study: str
    education_level: EducationLevel
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    preferred_language: str = "fr"
    scholarship_type: Optional[ScholarshipType] = None
    finance_type: Optional[str] = None
    
    @validator('gpa')
    def validate_gpa(cls, v):
        if v is not None and (v < 0 or v > 4.0):
            raise ValueError("GPA doit être entre 0 et 4.0")
        return v

class CriteriaBreakdown(BaseModel):
    """Détail des critères"""
    country: float = Field(..., ge=0, le=1)
    field: float = Field(..., ge=0, le=1)
    level: float = Field(..., ge=0, le=1)
    scholarship_type: float = Field(..., ge=0, le=1)
    origin: float = Field(..., ge=0, le=1)
    language: float = Field(..., ge=0, le=1)
    gpa: float = Field(..., ge=0, le=1)

class RecommendedScholarship(BaseModel):
    """Bourse recommandée"""
    id: str
    title: str
    country: str
    amount: Optional[str] = None
    currency: Optional[str] = None
    score: float = Field(..., ge=0, le=1)
    matchPercentage: float = Field(..., ge=0, le=100)
    criteriaBreakdown: CriteriaBreakdown
    reasons: List[str]
    deadline: Optional[str] = None
    deadlineStatus: Optional[str] = None
    daysUntilDeadline: Optional[int] = None

class RecommendationsResponse(BaseModel):
    """Réponse API complète"""
    status: str = "success"
    user: str
    totalScholarshipsAnalyzed: int
    totalScholarshipsReturned: int
    recommendations: List[RecommendedScholarship]
    timestamp: str
    executionTimeMs: float

class BatchRecommendationRequest(BaseModel):
    """Batch de profils"""
    profiles: List[UserProfileRequest]

class BatchRecommendationsResponse(BaseModel):
    """Réponse batch"""
    status: str = "success"
    totalProcessed: int
    totalFailed: int
    results: List[RecommendationsResponse]
    timestamp: str

# ==========================================
# MOTEUR V2+ HYBRIDE INTÉGRÉ
# ==========================================

class HybridRecommendationEngineV2Plus:
    """
    Moteur de recommandation hybride V2+ intégré
    ✅ Moteur V2 avancé + Infrastructure Supabase
    ✅ Scoring multicritères optimisé (28% pays, 22% domaine, etc.)
    ✅ MAX 10 résultats (limite stricte)
    ✅ Diversification intelligente
    ✅ Boost deadline
    ✅ Cache 1h
    """
    
    MAX_RESULTS = 10
    CACHE_DURATION_MINUTES = 60
    
    def __init__(self, supabase_client: Optional[Client] = None):
        self.supabase = supabase_client
        self._scholarships_cache = None
        self._cache_timestamp = None
        logger.info("✅ HybridRecommendationEngineV2Plus initialized")
    
    def recommend(self, user_profile: UserProfileRequest) -> Tuple[List[Dict[str, Any]], int, float]:
        """
        Générer recommandations pour utilisateur
        
        Returns:
            - List of recommendations (max 10)
            - Total scholarships analyzed
            - Execution time in milliseconds
        """
        start_time = time.time()
        
        try:
            # 1. Charger les bourses
            scholarships = self._load_scholarships()
            if not scholarships:
                logger.warning("❌ Aucune bourse trouvée")
                return [], 0, 0
            
            total_analyzed = len(scholarships)
            logger.info(f"📊 Analyse de {total_analyzed} bourses")
            
            # 2. Scorer toutes les bourses avec V2
            scored_scholarships = []
            for scholarship in scholarships:
                score_result = self._calculate_score_v2(user_profile, scholarship)
                if score_result:
                    scored_scholarships.append({
                        'scholarship': scholarship,
                        'score_data': score_result
                    })
            
            # 3. Trier par score décroissant
            scored_scholarships.sort(
                key=lambda x: x['score_data']['overall_score'],
                reverse=True
            )
            
            # 4. Appliquer diversification
            final_recommendations = self._diversify_results(scored_scholarships, self.MAX_RESULTS)
            
            logger.info(f"🎯 Retour de {len(final_recommendations)} recommandations (max {self.MAX_RESULTS})")
            
            # 5. Formatter résultats
            formatted_recs = []
            for item in final_recommendations:
                formatted = self._format_recommendation(
                    item['scholarship'],
                    item['score_data']
                )
                formatted_recs.append(formatted)
            
            execution_time = (time.time() - start_time) * 1000
            logger.info(f"⏱️  Temps d'exécution: {execution_time:.1f}ms")
            
            return formatted_recs, total_analyzed, execution_time
        
        except Exception as e:
            logger.error(f"❌ Erreur: {str(e)}")
            raise
    
    def _load_scholarships(self) -> List[Dict]:
        """Charger bourses avec cache 1h"""
        try:
            # Vérifier cache
            if self._scholarships_cache and self._cache_timestamp:
                age_minutes = (datetime.now() - self._cache_timestamp).total_seconds() / 60
                if age_minutes < self.CACHE_DURATION_MINUTES:
                    logger.info(f"💾 Cache utilisé ({age_minutes:.1f}min, {len(self._scholarships_cache)} bourses)")
                    return self._scholarships_cache
            
            # Charger depuis Supabase
            if not self.supabase:
                logger.warning("⚠️  Client Supabase non initialisé")
                return []
            
            logger.info("📥 Chargement depuis Supabase...")
            response = self.supabase.table('scholarship').select('*').execute()
            
            scholarships = response.data if response.data else []
            logger.info(f"✅ {len(scholarships)} bourses chargées")
            
            # Cache
            self._scholarships_cache = scholarships
            self._cache_timestamp = datetime.now()
            
            return scholarships
        
        except Exception as e:
            logger.error(f"❌ Erreur chargement: {str(e)}")
            return []
    
    def _calculate_score_v2(self, user: UserProfileRequest, scholarship: Dict) -> Optional[Dict]:
        """
        Calculer score global V2+ avec pondérations:
        28% Pays | 22% Domaine | 18% Niveau | 10% Type | 8% Origine | 8% Langue | 6% GPA
        """
        try:
            # Calculer chaque composante
            scores = {
                'country': self._score_country_v2(user, scholarship),
                'field': self._score_field_v2(user, scholarship),
                'level': self._score_level_v2(user, scholarship),
                'type': self._score_type_v2(user, scholarship),
                'origin': self._score_origin_v2(user, scholarship),
                'language': self._score_language_v2(user, scholarship),
                'gpa': self._score_gpa_v2(user, scholarship)
            }
            
            # Score global pondéré
            overall_score = (
                scores['country'] * WEIGHTS_V2['country_match'] +
                scores['field'] * WEIGHTS_V2['field_match'] +
                scores['level'] * WEIGHTS_V2['level_match'] +
                scores['type'] * WEIGHTS_V2['type_match'] +
                scores['origin'] * WEIGHTS_V2['origin_bonus'] +
                scores['language'] * WEIGHTS_V2['language_match'] +
                scores['gpa'] * WEIGHTS_V2['gpa_match']
            )
            
            # Boost deadline
            deadline_status, days_left, deadline_boost = self._analyze_deadline_v2(scholarship)
            overall_score = max(0, min(1, overall_score * (1 + deadline_boost)))
            
            # Générer raisons
            reasons = self._generate_reasons_v2(user, scholarship, scores)
            
            return {
                'overall_score': overall_score,
                'scores': scores,
                'reasons': reasons,
                'deadline_status': deadline_status,
                'days_until_deadline': days_left,
                'deadline_boost': deadline_boost
            }
        
        except Exception as e:
            logger.warning(f"⚠️  Erreur scoring {scholarship.get('id')}: {str(e)}")
            return None
    
    # ===== MÉTHODES DE SCORING V2 =====
    
    def _score_country_v2(self, user: UserProfileRequest, scholarship: Dict) -> float:
        """Score pays (28%) - V2 avancé"""
        user_country = user.target_country.lower().strip()
        scholarship_country = str(scholarship.get('pays', '')).lower().strip()
        scholarship_targets = str(scholarship.get('pays_cibles', '')).lower().strip()
        
        # Match exact
        if user_country == scholarship_country:
            return 1.0
        
        # Match dans pays cibles
        targets_list = [c.strip() for c in scholarship_targets.replace(';', ',').split(',')]
        if any(user_country in target or target in user_country for target in targets_list):
            return 0.95
        
        # Monde ouvert
        if any(kw in scholarship_targets for kw in ['monde', 'all', 'international', 'partout']):
            return 0.70
        
        # Même région
        user_region = self._get_region(user_country)
        scholarship_region = self._get_region(scholarship_country)
        
        if user_region and scholarship_region == user_region:
            return 0.60
        
        # Même continent
        if user_region and scholarship_region:
            if REGIONS.get(user_region, {}).get('continent') == \
               REGIONS.get(scholarship_region, {}).get('continent'):
                return 0.40
        
        # Cible régionale
        for region_name, region_data in REGIONS.items():
            if any(c in scholarship_targets for c in region_data['countries']):
                if user_region == region_name:
                    return 0.65
        
        return 0.10
    
    def _score_field_v2(self, user: UserProfileRequest, scholarship: Dict) -> float:
        """Score domaine (22%) - V2 avancé"""
        user_field = user.field_of_study.lower().strip()
        scholarship_field = str(scholarship.get('domaine_etude', '')).lower().strip()
        
        # Match exact
        if user_field == scholarship_field:
            return 1.0
        
        # Substring match
        if user_field in scholarship_field or scholarship_field in user_field:
            return 0.92
        
        # Même catégorie
        user_category = self._get_field_category(user_field)
        scholarship_category = self._get_field_category(scholarship_field)
        
        if user_category and scholarship_category == user_category:
            return 0.85
        
        # Synonymes
        for category, synonyms in FIELD_CATEGORIES.items():
            if any(syn in user_field for syn in synonyms) and \
               any(syn in scholarship_field for syn in synonyms):
                return 0.78
        
        # Tous les domaines
        if any(kw in scholarship_field for kw in ['tous', 'all', 'any', 'toutes']):
            return 0.60
        
        # Word similarity
        user_words = set(user_field.split())
        scholarship_words = set(scholarship_field.split())
        if user_words & scholarship_words:
            intersection = len(user_words & scholarship_words)
            union = len(user_words | scholarship_words)
            return 0.50 + (intersection / union if union > 0 else 0) * 0.30
        
        return 0.10
    
    def _score_level_v2(self, user: UserProfileRequest, scholarship: Dict) -> float:
        """Score niveau (18%) - V2 hiérarchique"""
        user_level = user.education_level.value.lower()
        scholarship_level = str(scholarship.get('niveau_etude', '')).lower().strip()
        
        # Get hierarchical values
        user_level_value = self._get_level_value(user_level)
        scholarship_level_values = self._get_level_values(scholarship_level)
        
        if user_level_value is None or not scholarship_level_values:
            return 0.50
        
        # Match exact
        if user_level_value in scholarship_level_values:
            return 1.0
        
        # Fourchette acceptable
        min_level = min(scholarship_level_values)
        max_level = max(scholarship_level_values)
        
        if min_level <= user_level_value <= max_level:
            return 0.95
        
        # Proche de fourchette
        if user_level_value < min_level and (min_level - user_level_value) == 1:
            return 0.80
        
        if user_level_value > max_level and (user_level_value - max_level) == 1:
            return 0.60
        
        # Tous les niveaux
        if 'tous' in scholarship_level or 'all' in scholarship_level:
            return 0.70
        
        return 0.20
    
    def _score_type_v2(self, user: UserProfileRequest, scholarship: Dict) -> float:
        """Score type (10%)"""
        if not user.scholarship_type:
            return 0.65
        
        user_type = user.scholarship_type.value.lower()
        scholarship_type = str(scholarship.get('type_bourse', '')).lower().strip()
        
        # Match exact
        if user_type in scholarship_type or scholarship_type in user_type:
            return 1.0
        
        # Mapping
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
        
        if 'complet' in scholarship_type and user_type in ['complète', 'full']:
            return 0.90
        
        return 0.50
    
    def _score_origin_v2(self, user: UserProfileRequest, scholarship: Dict) -> float:
        """Score origine (8%)"""
        user_origin = user.origin_country.lower().strip()
        scholarship_targets = str(scholarship.get('pays_cibles', '')).lower().strip()
        scholarship_country = str(scholarship.get('pays', '')).lower().strip()
        
        # Match exact
        if user_origin in scholarship_targets or \
           (user_origin in scholarship_country and scholarship_country in scholarship_targets):
            return 1.0
        
        # Même région
        user_region = self._get_region(user_origin)
        scholarship_region = self._get_region(scholarship_country)
        
        if user_region and scholarship_region == user_region:
            region_data = REGIONS.get(user_region, {})
            if any(c in scholarship_targets for c in region_data.get('countries', [])):
                return 0.80
        
        # Même continent
        if user_region and scholarship_region:
            user_continent = REGIONS.get(user_region, {}).get('continent')
            scholarship_continent = REGIONS.get(scholarship_region, {}).get('continent')
            
            if user_continent and user_continent == scholarship_continent:
                return 0.50
        
        # Monde ouvert
        if 'monde' in scholarship_targets or 'all' in scholarship_targets:
            return 0.40
        
        return 0.0
    
    def _score_language_v2(self, user: UserProfileRequest, scholarship: Dict) -> float:
        """Score langue (8%)"""
        user_lang = user.preferred_language.lower().strip()
        scholarship_text = (str(scholarship.get('titre', '')) + " " + 
                          str(scholarship.get('description', ''))).lower()
        
        # Check language variants
        for lang, variants in LANGUAGE_VARIANTS.items():
            if user_lang in lang or user_lang in variants:
                if user_lang in scholarship_text or \
                   any(v in scholarship_text for v in variants):
                    return 1.0
        
        # Default pour pays
        scholarship_country = str(scholarship.get('pays', '')).lower()
        if 'france' in scholarship_country:
            if user_lang == 'fr' or user_lang == 'français':
                return 0.90
        if 'usa' in scholarship_country or 'uk' in scholarship_country:
            if user_lang == 'en' or user_lang == 'anglais':
                return 0.90
        
        # International
        if any(kw in scholarship_text for kw in ['international', 'multilingual', 'multiple languages']):
            return 0.70
        
        # Default EN
        if user_lang == 'en' or user_lang == 'english':
            return 0.60
        
        return 0.40
    
    def _score_gpa_v2(self, user: UserProfileRequest, scholarship: Dict) -> float:
        """Score GPA (6%)"""
        if not user.gpa:
            return 0.65
        
        # Estimer sélectivité
        scholarship_text = (str(scholarship.get('titre', '')) + " " + 
                          str(scholarship.get('domaine_etude', ''))).lower()
        
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
            return 1.0
        elif user.gpa >= gpa_min:
            return 0.85
        elif user.gpa >= gpa_min - 0.3:
            return 0.65
        elif user.gpa >= gpa_min - 0.5:
            return 0.45
        else:
            return 0.20
    
    def _analyze_deadline_v2(self, scholarship: Dict) -> Tuple[str, Optional[int], float]:
        """Analyser deadline avec boost"""
        try:
            deadline_str = scholarship.get('date_limite')
            if not deadline_str:
                return 'inconnu', None, 0.0
            
            deadline_date = datetime.strptime(str(deadline_str), '%Y-%m-%d')
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
    
    def _diversify_results(self, recommendations: List[Dict], top_n: int) -> List[Dict]:
        """Diversifier par pays et domaine"""
        diverse = []
        countries_used = set()
        
        # Passe 1: Meilleur de chaque pays
        for rec in recommendations:
            if len(diverse) >= top_n:
                break
            country = rec['scholarship'].get('pays', '').lower()
            if country not in countries_used:
                diverse.append(rec)
                countries_used.add(country)
        
        # Passe 2: Compléter
        for rec in recommendations:
            if len(diverse) >= top_n:
                break
            if rec not in diverse:
                diverse.append(rec)
        
        return diverse[:top_n]
    
    def _generate_reasons_v2(self, user: UserProfileRequest, scholarship: Dict, 
                            scores: Dict) -> List[str]:
        """Générer raisons du match"""
        reasons = []
        
        if scores['country'] >= 0.95:
            reasons.append(f"✅ Destiné pour {scholarship.get('pays')} - Match exact")
        elif scores['country'] >= 0.80:
            reasons.append(f"✅ Accepte votre destination")
        elif scores['country'] >= 0.60:
            reasons.append("⚠️  Ouvert à votre région")
        
        if scores['field'] >= 0.95:
            reasons.append(f"✅ {user.field_of_study} - Correspondance parfaite")
        elif scores['field'] >= 0.75:
            reasons.append("✅ Domaine compatible")
        
        if scores['level'] >= 0.95:
            reasons.append(f"✅ {scholarship.get('niveau_etude')} - Niveau exact")
        elif scores['level'] >= 0.75:
            reasons.append("✅ Niveau accepté")
        
        if scores['gpa'] >= 0.90 and user.gpa:
            reasons.append(f"📊 Votre GPA {user.gpa} surpasse les exigences")
        
        if scores['language'] >= 0.85:
            reasons.append(f"🗣️  Disponible en {user.preferred_language}")
        
        if not reasons:
            reasons.append("📍 Bourse générale multi-régionale")
        
        return reasons
    
    def _format_recommendation(self, scholarship: Dict, score_data: Dict) -> Dict:
        """Formatter pour output TypeScript"""
        deadline_status, days_until = score_data['deadline_status'], score_data['days_until_deadline']
        
        return {
            'id': str(scholarship.get('id', '')),
            'title': scholarship.get('titre', scholarship.get('title', 'N/A')),
            'country': scholarship.get('pays', scholarship.get('country', 'N/A')),
            'amount': str(scholarship.get('montant', '')) if scholarship.get('montant') else None,
            'currency': scholarship.get('devise') or scholarship.get('currency'),
            'score': round(score_data['overall_score'], 3),
            'matchPercentage': round(score_data['overall_score'] * 100, 1),
            'criteriaBreakdown': {
                'country': round(score_data['scores']['country'], 3),
                'field': round(score_data['scores']['field'], 3),
                'level': round(score_data['scores']['level'], 3),
                'scholarship_type': round(score_data['scores']['type'], 3),
                'origin': round(score_data['scores']['origin'], 3),
                'language': round(score_data['scores']['language'], 3),
                'gpa': round(score_data['scores']['gpa'], 3)
            },
            'reasons': score_data['reasons'],
            'deadline': scholarship.get('date_limite'),
            'deadlineStatus': deadline_status,
            'daysUntilDeadline': days_until
        }
    
    # ===== HELPERS GÉOGRAPHIE =====
    
    def _get_region(self, country: str) -> Optional[str]:
        """Obtenir région d'un pays"""
        country = country.lower().strip()
        for region_name, region_data in REGIONS.items():
            if any(c in country for c in region_data['countries']):
                return region_name
        return None
    
    # ===== HELPERS DOMAINES =====
    
    def _get_field_category(self, field: str) -> Optional[str]:
        """Obtenir catégorie d'un domaine"""
        field = field.lower().strip()
        for category, synonyms in FIELD_CATEGORIES.items():
            if field in synonyms or any(syn in field for syn in synonyms):
                return category
        return None
    
    # ===== HELPERS NIVEAUX =====
    
    def _get_level_value(self, level: str) -> Optional[int]:
        """Obtenir valeur hiérarchique"""
        level = level.lower().strip()
        for key, value in LEVEL_HIERARCHY.items():
            if key in level or level in key:
                return value
        return None
    
    def _get_level_values(self, level_str: str) -> List[int]:
        """Obtenir valeurs possibles"""
        level_str = level_str.lower().strip()
        values = []
        for key, value in LEVEL_HIERARCHY.items():
            if key in level_str or level_str in key:
                if value not in values:
                    values.append(value)
        return sorted(values) if values else []

# ==========================================
# FASTAPI APPLICATION
# ==========================================

def init_supabase() -> Optional[Client]:
    """Initialiser Supabase"""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not supabase_url or not supabase_key:
        logger.warning("⚠️  Variables Supabase manquantes")
        return None
    
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        logger.error(f"❌ Erreur Supabase: {e}")
        return None

# Initialiser
supabase = init_supabase()
engine = HybridRecommendationEngineV2Plus(supabase)

# FastAPI app
app = FastAPI(
    title="🎓 API Recommandation Bourses V2+",
    description="Moteur hybride V2+ - Scoring multicritères avancé",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# ROUTES API
# ==========================================

@app.get("/", tags=["Info"])
async def root():
    """Info API"""
    return {
        "name": "🎓 API Recommandation Bourses V2+",
        "version": "2.0.0",
        "maxResults": 10,
        "engine": "HybridRecommendationEngineV2Plus",
        "description": "Scoring multicritères avancé avec diversification",
        "endpoints": {
            "POST /recommendations": "Obtenir 10 meilleures bourses",
            "POST /recommendations/batch": "Batch processing",
            "GET /health": "Vérifier santé"
        }
    }

@app.get("/health", tags=["Health"])
async def health():
    """Santé API"""
    return {
        "status": "healthy",
        "database": "connected" if supabase else "disabled",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/recommendations", response_model=RecommendationsResponse, tags=["Recommendations"])
async def get_recommendations(profile: UserProfileRequest):
    """
    Obtenir les meilleures bourses pour un utilisateur
    
    ⚠️ Retourne MAXIMUM 10 bourses
    """
    try:
        recommendations, total_analyzed, execution_time = engine.recommend(profile)
        
        return RecommendationsResponse(
            status="success",
            user=profile.full_name,
            totalScholarshipsAnalyzed=total_analyzed,
            totalScholarshipsReturned=len(recommendations),
            recommendations=[RecommendedScholarship(**rec) for rec in recommendations],
            timestamp=datetime.now().isoformat(),
            executionTimeMs=execution_time
        )
    
    except Exception as e:
        logger.error(f"❌ Erreur: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommendations/batch", response_model=BatchRecommendationsResponse, tags=["Recommendations"])
async def get_batch_recommendations(request: BatchRecommendationRequest):
    """Traiter plusieurs profils"""
    results = []
    failed = 0
    
    for profile in request.profiles:
        try:
            recommendations, total_analyzed, execution_time = engine.recommend(profile)
            
            results.append(RecommendationsResponse(
                status="success",
                user=profile.full_name,
                totalScholarshipsAnalyzed=total_analyzed,
                totalScholarshipsReturned=len(recommendations),
                recommendations=[RecommendedScholarship(**rec) for rec in recommendations],
                timestamp=datetime.now().isoformat(),
                executionTimeMs=execution_time
            ))
        except Exception as e:
            logger.warning(f"⚠️  Erreur pour {profile.full_name}: {str(e)}")
            failed += 1
    
    return BatchRecommendationsResponse(
        totalProcessed=len(request.profiles),
        totalFailed=failed,
        results=results,
        timestamp=datetime.now().isoformat()
    )

# ==========================================
# LANCEMENT
# ==========================================

if __name__ == "__main__":
    import uvicorn
    
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║   🎓 API RECOMMANDATION BOURSES V2+ - INTÉGRÉE              ║
    ║                                                              ║
    ║   ✅ Moteur V2 avancé intégré                              ║
    ║   ✅ Scoring: 28% pays, 22% domaine, 18% niveau           ║
    ║   ✅ Limit stricte: MAX 10 bourses                         ║
    ║   ✅ Diversification intelligente                          ║
    ║   ✅ Boost deadline                                         ║
    ║   ✅ Cache 1h optimisé                                      ║
    ║   ✅ Supabase intégré                                       ║
    ║                                                              ║
    ║   Docs: http://localhost:8000/docs                          ║
    ║   Health: http://localhost:8000/health                      ║
    ║                                                              ║
    ║   Démarrage en cours...                                     ║
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "api_recommendations_final:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
