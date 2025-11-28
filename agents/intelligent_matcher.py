"""
Intelligent project matching based on weighted criteria
"""
from typing import Dict, Any, Optional
from shared_logger import log_agent_action


class IntelligentMatcher:
    """Calculate project relevance based on weighted criteria matching"""
    
    # Веса критериев (сумма = 1.0)
    WEIGHT_TIME_LEFT = 0.5   # Приоритет: максимально приближённое время
    WEIGHT_PROPOSALS = 0.4   # Второй приоритет: количество предложений
    WEIGHT_HIRED = 0.1       # Последний приоритет: процент нанятых
    
    def __init__(self, target_time_left=None, target_proposals=None, target_hired=None):
        self.target_time_left = target_time_left
        self.target_proposals = target_proposals
        self.target_hired = target_hired
        
        log_agent_action("IntelligentMatcher", 
            f"Initialized with targets: time={target_time_left}h, "
            f"proposals<={target_proposals}, hired>={target_hired}%")
    
    def calculate_relevance_score(self, project: Dict[str, Any]) -> float:
        """
        Calculate weighted relevance score (0.0 - 1.0) based on weighted criteria
        Returns: float score where 1.0 is perfect match
        """
        total_score = 0.0
        weights_used = 0.0
        
        # 1. Time left score (weight: 0.5)
        if self.target_time_left is not None:
            time_score = self._calculate_time_score(
                project.get('time_left_hours'),
                self.target_time_left
            )
            total_score += time_score * self.WEIGHT_TIME_LEFT
            weights_used += self.WEIGHT_TIME_LEFT
        
        # 2. Proposals score (weight: 0.4)
        if self.target_proposals is not None:
            proposals_score = self._calculate_proposals_score(
                project.get('proposals', 0),
                self.target_proposals
            )
            total_score += proposals_score * self.WEIGHT_PROPOSALS
            weights_used += self.WEIGHT_PROPOSALS
        
        # 3. Hired score (weight: 0.1)
        if self.target_hired is not None:
            hired_score = self._calculate_hired_score(
                project.get('hired', 0),
                self.target_hired
            )
            total_score += hired_score * self.WEIGHT_HIRED
            weights_used += self.WEIGHT_HIRED
        
        # Нормализация: если не все критерии заданы, нормализуем по использованным весам
        if weights_used > 0:
            return total_score / weights_used
        return 0.0
    
    def _calculate_time_score(self, actual_hours: Optional[int], target_hours: int) -> float:
        """
        Calculate how close actual time is to target
        Perfect match (actual == target) = 1.0
        Uses inverse distance: closer = higher score
        
        Returns:
            - 0.0 if distance > 24
            - 1.0 - distance / 24.0 for all other cases (clamped to [0.0, 1.0])
        """
        if actual_hours is None:
            return 0.0
        
        # Calculate distance
        distance = abs(actual_hours - target_hours)
        
        # Return 0.0 if distance > 24
        if distance > 24:
            return 0.0
        
        # Linear interpolation: score = 1.0 - distance / 24.0
        score = 1.0 - (distance / 24.0)
        
        # Clamp to [0.0, 1.0]
        return max(0.0, min(1.0, score))
    
    def _calculate_proposals_score(self, actual_proposals: int, target_proposals: int) -> float:
        """
        Calculate proposals score based on new logic:
        - Returns 1.0 if actual_proposals <= 2
        - Linear decrease from 1.0 to 0.0 if 2 < actual_proposals <= 5
        - Returns 0.0 if actual_proposals > 5
        
        Note: target_proposals parameter is kept for API compatibility but not used in calculation
        """
        if actual_proposals is None:
            return 0.0
        
        # Returns 1.0 if actual_proposals <= 2
        if actual_proposals <= 2:
            return 1.0
        
        # Returns 0.0 if actual_proposals > 5
        if actual_proposals > 5:
            return 0.0
        
        # Linear decrease from 1.0 to 0.0 for 2 < actual_proposals <= 5
        # When actual_proposals = 2: score = 1.0
        # When actual_proposals = 5: score = 0.0
        # Linear interpolation: score = 1.0 - ((actual_proposals - 2) / (5 - 2))
        score = 1.0 - ((actual_proposals - 2) / 3.0)
        
        # Clamp to [0.0, 1.0] (should already be in range, but safety check)
        return max(0.0, min(1.0, score))
    
    def _calculate_hired_score(self, actual_hired: int, target_hired: int) -> float:
        """
        Calculate hired score - projects with hired >= target are preferred
        """
        if actual_hired is None:
            return 0.0
        
        # Если нанято больше или равно целевому - идеально (1.0)
        if actual_hired >= target_hired:
            return 1.0
        
        # Если меньше - пропорциональный штраф
        if target_hired > 0:
            score = actual_hired / target_hired
            return max(0.0, min(1.0, score))
        else:
            return 1.0 if actual_hired == 0 else 0.0

