"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navigation } from "@/components/ui/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Network,
  TreePine,
  Wand2,
  Upload,
  Search,
  BarChart3,
  Brain,
  Tags,
  Eye,
  TrendingUp,
  Users,
  BookOpen,
  Target,
  Zap,
  Globe,
  Plus,
  MoreVertical,
  Edit,
  ChevronDown,
  ChevronRight,
  Merge,
  Split,
  Archive,
  Copy,
  Trash2,
} from "lucide-react";

// Import the components we created
import { ConceptMapViewer } from "@/components/Features/conceptManagement/ConceptMapViewer";
import { BulkOperationsPanel } from "@/components/Features/conceptManagement/BulkOperationsPanel";
import { ConceptImporter } from "@/components/Features/conceptManagement/ConceptImporter";
import { MergeConceptDialog } from "@/components/Features/conceptManagement/MergeConceptDialog";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";

// Types for the concept management page
interface ConceptData {
  id: string;
  name: string;
  category: "grammar" | "vocabulary";
  description: string;
  difficulty: string;
  tags: string[];
  isActive: boolean;
  lastUpdated: string;
  examples: string[];
  confidence: number;
  sourceType: "course" | "document" | "manual" | "import";
  vocabularyData?: {
    word: string;
    translation: string;
    partOfSpeech: string;
    gender?: string;
    pluralForm?: string;
    pronunciation?: string;
  };
}

interface BulkOperation {
  type: "tag-assignment" | "category-change" | "difficulty-change";
  conceptIds: string[];
  parameters: Record<string, unknown>;
  preview: boolean;
}

interface BulkConcept {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  tags: string[];
}

// Utility function to calculate majority difficulty from concepts
const calculateMajorityDifficulty = (concepts: ConceptData[]): string => {
  if (!concepts || concepts.length === 0) return "A1"; // Default fallback
  
  const difficultyCounts: Record<string, number> = {};
  
  // Count each difficulty level
  concepts.forEach(concept => {
    const difficulty = concept.difficulty || "A1";
    difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;
  });
  
  // Find the difficulty with the highest count
  let maxCount = 0;
  let majorityDifficulty = "A1";
  
  Object.entries(difficultyCounts).forEach(([difficulty, count]) => {
    if (count > maxCount) {
      maxCount = count;
      majorityDifficulty = difficulty;
    }
  });
  
  return majorityDifficulty;
};

// Utility function to calculate majority difficulty from groups
const calculateMajorityDifficultyFromGroups = (groups: any[]): string => {
  if (!groups || groups.length === 0) return "A1"; // Default fallback
  
  const difficultyCounts: Record<string, number> = {};
  
  // Count each difficulty level from groups
  groups.forEach(group => {
    const difficulty = group.difficulty || "A1";
    difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;
  });
  
  // Find the difficulty with the highest count
  let maxCount = 0;
  let majorityDifficulty = "A1";
  
  Object.entries(difficultyCounts).forEach(([difficulty, count]) => {
    if (count > maxCount) {
      maxCount = count;
      majorityDifficulty = difficulty;
    }
  });
  
  return majorityDifficulty;
};

type TabValue =
  | "dashboard"
  | "explorer"
  | "map"
  | "hierarchy"
  | "bulk"
  | "import";

interface ConceptStats {
  total: number;
  vocabulary: number;
  grammar: number;
  byDifficulty: Record<string, number>;
  bySource: Record<string, number>;
  recentlyAdded: number;
  topTags: Array<{ tag: string; count: number }>;
}

interface LLMExplorationResult {
  relatedConcepts: Array<{
    id: string;
    name: string;
    similarity: number;
    reasoning: string;
  }>;
  suggestedTags: string[];
  categoryAnalysis: string;
  difficultyAnalysis: string;
}

export default function ConceptManagementPage() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "explorer" | "map" | "hierarchy" | "bulk" | "import"
  >("dashboard");
  const [concepts, setConcepts] = useState<ConceptData[]>([]);
  const [conceptGroups, setConceptGroups] = useState<any[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<ConceptStats | null>(null);

  // LLM Exploration State
  const [llmQuery, setLlmQuery] = useState("");
  const [llmResults, setLlmResults] = useState<LLMExplorationResult | null>(
    null
  );
  const [selectedConcept, setSelectedConcept] = useState<ConceptData | null>(
    null
  );
  const [editMode, setEditMode] = useState(false);

  // Tag-based Category Creation
  const [categoryCreationMode, setCategoryCreationMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedTagsForCategory, setSelectedTagsForCategory] = useState<
    string[]
  >([]);
  const [selectedConceptsForGroup, setSelectedConceptsForGroup] = useState<
    string[]
  >([]);

  // Merge Dialog State
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  // Concept Groups Management State
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupSearchTerm, setGroupSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("all"); // all, vocabulary, grammar, mixed
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [editGroupDifficulty, setEditGroupDifficulty] = useState("A1");

  // Concept Selector Modal State
  const [showConceptSelector, setShowConceptSelector] = useState(false);
  const [conceptSelectorSearch, setConceptSelectorSearch] = useState("");
  const [selectedConceptsToAdd, setSelectedConceptsToAdd] = useState<string[]>([]);

  // Super Group Management State
  const [showSuperGroupCreator, setShowSuperGroupCreator] = useState(false);
  const [selectedGroupsForSuperGroup, setSelectedGroupsForSuperGroup] = useState<string[]>([]);
  const [superGroupName, setSuperGroupName] = useState("");
  const [superGroupDescription, setSuperGroupDescription] = useState("");
  const [expandedSuperGroups, setExpandedSuperGroups] = useState<Set<string>>(new Set());
  
  // Collapsible sections state (collapsed by default)
  const [superGroupsSectionExpanded, setSuperGroupsSectionExpanded] = useState(false);
  const [groupsSectionExpanded, setGroupsSectionExpanded] = useState(false);
  
  // Supergroup manage groups state
  const [showManageGroups, setShowManageGroups] = useState(false);
  const [availableGroupsForSupergroup, setAvailableGroupsForSupergroup] = useState<any[]>([]);

  // Calculate statistics
  const calculateStats = useCallback((conceptData: ConceptData[]) => {
    const stats: ConceptStats = {
      total: conceptData.length,
      vocabulary: conceptData.filter((c) => c.category === "vocabulary").length,
      grammar: conceptData.filter((c) => c.category === "grammar").length,
      byDifficulty: {},
      bySource: {},
      recentlyAdded: conceptData.filter((c) => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(c.lastUpdated) > oneWeekAgo;
      }).length,
      topTags: [],
    };

    // Count by difficulty
    conceptData.forEach((c) => {
      stats.byDifficulty[c.difficulty] =
        (stats.byDifficulty[c.difficulty] || 0) + 1;
      stats.bySource[c.sourceType] = (stats.bySource[c.sourceType] || 0) + 1;
    });

    // Count tags
    const tagCounts: Record<string, number> = {};
    conceptData.forEach((c) => {
      c.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    stats.topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    setStats(stats);
  }, []);

  // Load concepts from API
  const loadConcepts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/concepts?limit=2000");
      const data = await response.json();

      if (data.success) {
        setConcepts(data.data);
        calculateStats(data.data);
      }
    } catch (error) {
      console.error("Failed to load concepts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateStats]);

  // Load concept groups from API
  const loadConceptGroups = useCallback(async () => {
    try {
      const response = await fetch("/api/concept-groups?includeHierarchy=true");
      const data = await response.json();

      if (data.success) {
        setConceptGroups(data.data);
      }
    } catch (error) {
      console.error("Failed to load concept groups:", error);
    }
  }, []);

  // Filter concepts based on current filters
  const filteredConcepts = useMemo(() => {
    return concepts.filter((concept) => {
      const matchesSearch =
        concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesCategory =
        !categoryFilter ||
        categoryFilter === "all" ||
        concept.category === categoryFilter;
      const matchesDifficulty =
        !difficultyFilter ||
        difficultyFilter === "all" ||
        concept.difficulty === difficultyFilter;
      const matchesTag =
        tagFilter.length === 0 ||
        tagFilter.every((tag) => concept.tags.includes(tag));

      return (
        matchesSearch && matchesCategory && matchesDifficulty && matchesTag
      );
    });
  }, [concepts, searchTerm, categoryFilter, difficultyFilter, tagFilter]);

  // Get unique tags for filtering
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    concepts.forEach((concept) => {
      concept.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [concepts]);

  // Filter groups based on search and filters
  const filteredGroups = useMemo(() => {
    return conceptGroups.filter((group) => {
      const matchesSearch = group.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
                           group.description?.toLowerCase().includes(groupSearchTerm.toLowerCase());
      const matchesFilter = groupFilter === "all" || group.groupType === groupFilter;
      return matchesSearch && matchesFilter;
    });
  }, [conceptGroups, groupSearchTerm, groupFilter]);

  // Filter available concepts for adding to group (exclude already added ones)
  const availableConceptsForGroup = useMemo(() => {
    if (!selectedGroup) return [];
    
    const alreadyInGroup = selectedGroup.memberConcepts || [];
    return concepts.filter((concept) => {
      const notInGroup = !alreadyInGroup.includes(concept.id);
      const matchesSearch = concept.name.toLowerCase().includes(conceptSelectorSearch.toLowerCase()) ||
                           concept.description.toLowerCase().includes(conceptSelectorSearch.toLowerCase());
      return notInGroup && matchesSearch;
    });
  }, [concepts, selectedGroup, conceptSelectorSearch]);

  // Organize groups into hierarchy structure
  const organizedGroups = useMemo(() => {
    const superGroups: any[] = [];
    const standaloneGroups: any[] = [];
    
    
    // Separate super groups (level 3) and regular groups (level 2)
    conceptGroups.forEach(group => {
      if (group.level === 3) {
        // This is a super group
        const childGroups = conceptGroups.filter(g => g.parentGroup === group.id);
        superGroups.push({
          ...group,
          children: childGroups,
          totalConcepts: childGroups.reduce((sum, child) => sum + (child.memberConcepts?.length || 0), 0)
        });
      } else if (group.level === 2) {
        // This is a regular group (show all level 2 groups regardless of parent)
        standaloneGroups.push(group);
      }
    });

    return { superGroups, standaloneGroups };
  }, [conceptGroups]);

  // Filter organized groups based on search and filters
  const filteredOrganizedGroups = useMemo(() => {
    const filterGroup = (group: any) => {
      const matchesSearch = group.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
                           group.description?.toLowerCase().includes(groupSearchTerm.toLowerCase());
      const matchesFilter = groupFilter === "all" || group.groupType === groupFilter;
      return matchesSearch && matchesFilter;
    };

    const filteredSuperGroups = organizedGroups.superGroups
      .map(superGroup => ({
        ...superGroup,
        children: superGroup.children.filter(filterGroup)
      }))
      .filter(superGroup => 
        filterGroup(superGroup) || superGroup.children.length > 0
      );

    const filteredStandaloneGroups = organizedGroups.standaloneGroups.filter(filterGroup);

    return {
      superGroups: filteredSuperGroups,
      standaloneGroups: filteredStandaloneGroups
    };
  }, [organizedGroups, groupSearchTerm, groupFilter]);

  // Load concepts and groups on mount
  useEffect(() => {
    loadConcepts();
    loadConceptGroups();
  }, [loadConcepts, loadConceptGroups]);

  // Sync selectedGroup with updated conceptGroups data
  useEffect(() => {
    if (selectedGroup && conceptGroups.length > 0) {
      const updatedSelectedGroup = conceptGroups.find(g => g.id === selectedGroup.id);
      if (updatedSelectedGroup) {
        // For supergroups, rebuild children array from conceptGroups
        if (updatedSelectedGroup.level === 3) {
          const childGroups = conceptGroups.filter(g => g.parentGroup === updatedSelectedGroup.id);
          const groupWithChildren = {
            ...updatedSelectedGroup,
            children: childGroups,
            totalConcepts: childGroups.reduce((sum, child) => sum + (child.memberConcepts?.length || 0), 0)
          };
          setSelectedGroup(groupWithChildren);
        } else {
          setSelectedGroup(updatedSelectedGroup);
        }
      }
    }
  }, [conceptGroups, selectedGroup?.id]);

  // Update available groups when manage groups modal is open and data changes
  useEffect(() => {
    if (showManageGroups && selectedGroup && selectedGroup.level === 3) {
      const childIds = selectedGroup.children?.map((child: any) => child.id) || [];
      const available = conceptGroups.filter(group => 
        group.level === 2 && 
        group.id !== selectedGroup.id &&
        !childIds.includes(group.id)
      );
      setAvailableGroupsForSupergroup(available);
    }
  }, [showManageGroups, selectedGroup, conceptGroups]);

  // Auto-select concepts when tags are selected
  useEffect(() => {
    if (selectedTagsForCategory.length > 0) {
      const matchingConceptIds = concepts
        .filter((c) =>
          c.tags.some((tag) =>
            selectedTagsForCategory.includes(tag)
          )
        )
        .map((c) => c.id);
      setSelectedConceptsForGroup(matchingConceptIds);
    } else {
      setSelectedConceptsForGroup([]);
    }
  }, [selectedTagsForCategory, concepts]);

  // Handle concept selection
  const toggleConceptSelection = useCallback((conceptId: string) => {
    setSelectedConcepts((prev) =>
      prev.includes(conceptId)
        ? prev.filter((id) => id !== conceptId)
        : [...prev, conceptId]
    );
  }, []);

  // Handle LLM exploration
  const handleLLMExploration = useCallback(async () => {
    if (!llmQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/concepts/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: llmQuery,
          mode: "similarity",
          includeAnalysis: true,
          maxResults: 10,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result: LLMExplorationResult = {
          relatedConcepts: data.data.relatedConcepts || [],
          suggestedTags: data.data.suggestedTags || [],
          categoryAnalysis: data.data.categoryAnalysis || "",
          difficultyAnalysis: data.data.difficultyAnalysis || "",
        };

        setLlmResults(result);
      } else {
        console.error("LLM exploration failed:", data.error);
      }
    } catch (error) {
      console.error("LLM exploration failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [llmQuery]);

  // Handle category creation from tags
  const handleCreateCategoryFromTags = useCallback(async () => {
    if (!newCategoryName || selectedTagsForCategory.length === 0) return;

    try {
      // Calculate majority difficulty from selected concepts
      const selectedConcepts = concepts.filter(concept => 
        selectedConceptsForGroup.includes(concept.id)
      );
      const majorityDifficulty = calculateMajorityDifficulty(selectedConcepts);

      const response = await fetch("/api/concept-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName,
          description: `Category created from tags: ${selectedTagsForCategory.join(", ")}`,
          groupType: "mixed",
          level: 2,
          difficulty: majorityDifficulty,
        }),
      });

      if (response.ok) {
        // Add selected concepts to the new group
        if (selectedConceptsForGroup.length > 0) {
          const groupData = await response.json();
          await fetch(`/api/concept-groups/${groupData.data.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conceptIds: selectedConceptsForGroup }),
          });
        }

        // Reset form
        setNewCategoryName("");
        setSelectedTagsForCategory([]);
        setSelectedConceptsForGroup([]);
        setCategoryCreationMode(false);
        
        // Refresh concept groups
        loadConceptGroups();
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  }, [newCategoryName, selectedTagsForCategory, concepts]);

  // Handle group selection
  const handleGroupSelect = useCallback((group: any) => {
    setSelectedGroup(group);
    setIsEditingGroup(false);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description || "");
  }, []);

  // Handle group editing
  const handleGroupEdit = useCallback(() => {
    if (selectedGroup) {
      setEditGroupName(selectedGroup.name || "");
      setEditGroupDescription(selectedGroup.description || "");
      setEditGroupDifficulty(selectedGroup.difficulty || "A1");
      setIsEditingGroup(true);
    }
  }, [selectedGroup]);

  // Handle save group changes
  const handleSaveGroup = useCallback(async () => {
    if (!selectedGroup) return;

    try {
      const response = await fetch(`/api/concept-groups/${selectedGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editGroupName,
          description: editGroupDescription,
          difficulty: editGroupDifficulty,
        }),
      });

      if (response.ok) {
        setIsEditingGroup(false);
        await loadConceptGroups();
        // Update selected group with new data
        const updatedGroup = { ...selectedGroup, name: editGroupName, description: editGroupDescription, difficulty: editGroupDifficulty };
        setSelectedGroup(updatedGroup);
      }
    } catch (error) {
      console.error("Failed to update group:", error);
    }
  }, [selectedGroup, editGroupName, editGroupDescription, editGroupDifficulty, loadConceptGroups]);

  // Handle delete group/supergroup
  const handleDeleteGroup = useCallback(async () => {
    if (!selectedGroup) return;
    
    const isSuper = selectedGroup.level === 3;
    const confirmMessage = `Are you sure you want to delete this ${isSuper ? 'supergroup' : 'group'}? ${isSuper ? 'Child groups will become standalone groups.' : ''} This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) return;

    try {
      // If deleting a supergroup, first remove all child groups from it
      if (isSuper && selectedGroup.children?.length > 0) {
        const childUpdatePromises = selectedGroup.children.map((child: any) =>
          fetch(`/api/concept-groups/${child.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              parentGroup: null,
            }),
          })
        );
        
        await Promise.all(childUpdatePromises);
      }

      // Now delete the group/supergroup
      const response = await fetch(`/api/concept-groups/${selectedGroup.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setSelectedGroup(null);
        setIsEditingGroup(false);
        await loadConceptGroups();
        console.log(`${isSuper ? 'Supergroup' : 'Group'} deleted successfully`);
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  }, [selectedGroup, loadConceptGroups]);

  // Handle manage groups for supergroup
  const handleManageGroups = useCallback(() => {
    if (!selectedGroup || selectedGroup.level !== 3) return;
    
    // Get all level 2 groups that could be added to this supergroup
    // Exclude groups that are already children of this supergroup
    const childIds = selectedGroup.children?.map((child: any) => child.id) || [];
    const available = conceptGroups.filter(group => 
      group.level === 2 && 
      group.id !== selectedGroup.id &&
      !childIds.includes(group.id)
    );
    setAvailableGroupsForSupergroup(available);
    setShowManageGroups(true);
  }, [selectedGroup, conceptGroups]);

  // Handle add group to supergroup
  const handleAddGroupToSupergroup = useCallback(async (groupId: string) => {
    if (!selectedGroup) return;

    try {
      const response = await fetch(`/api/concept-groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentGroup: selectedGroup.id,
        }),
      });

      if (response.ok) {
        // Find the group being added
        const groupToAdd = availableGroupsForSupergroup.find(g => g.id === groupId);
        
        if (groupToAdd) {
          // Update selectedGroup immediately to show in current groups
          const updatedGroup = {
            ...selectedGroup,
            children: [...(selectedGroup.children || []), { ...groupToAdd, parentGroup: selectedGroup.id }],
            totalConcepts: (selectedGroup.totalConcepts || 0) + (groupToAdd.memberConcepts?.length || 0)
          };
          setSelectedGroup(updatedGroup);
          
          // Remove from available groups immediately
          setAvailableGroupsForSupergroup(prev => prev.filter(g => g.id !== groupId));
        }
        
        // Reload data in background to ensure consistency
        await loadConceptGroups();
      }
    } catch (error) {
      console.error("Failed to add group to supergroup:", error);
    }
  }, [selectedGroup, availableGroupsForSupergroup, loadConceptGroups]);

  // Handle remove group from supergroup
  const handleRemoveGroupFromSupergroup = useCallback(async (groupId: string) => {
    if (!selectedGroup) return;
    
    try {
      const response = await fetch(`/api/concept-groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentGroup: null,
        }),
      });

      if (response.ok) {
        // Find the group being removed
        const groupToRemove = selectedGroup.children?.find((child: any) => child.id === groupId);
        
        if (groupToRemove) {
          // Update selectedGroup immediately to remove from current groups
          const updatedGroup = {
            ...selectedGroup,
            children: selectedGroup.children?.filter((child: any) => child.id !== groupId) || [],
            totalConcepts: (selectedGroup.totalConcepts || 0) - (groupToRemove.memberConcepts?.length || 0)
          };
          setSelectedGroup(updatedGroup);
          
          // Add to available groups immediately
          setAvailableGroupsForSupergroup(prev => {
            const exists = prev.some(g => g.id === groupId);
            if (!exists) {
              return [...prev, { ...groupToRemove, parentGroup: null }];
            }
            return prev;
          });
        }
        
        // Reload data in background to ensure consistency
        await loadConceptGroups();
      }
    } catch (error) {
      console.error("Failed to remove group from supergroup:", error);
    }
  }, [selectedGroup, loadConceptGroups]);

  // Handle remove concept from group
  const handleRemoveConceptFromGroup = useCallback(async (conceptId: string) => {
    if (!selectedGroup) return;

    try {
      const response = await fetch(`/api/concept-groups/${selectedGroup.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptIds: [conceptId] }),
      });

      if (response.ok) {
        await loadConceptGroups();
        // Update selected group to reflect changes
        const updatedGroup = {
          ...selectedGroup,
          memberConcepts: selectedGroup.memberConcepts?.filter((id: string) => id !== conceptId) || []
        };
        setSelectedGroup(updatedGroup);
      }
    } catch (error) {
      console.error("Failed to remove concept from group:", error);
    }
  }, [selectedGroup, loadConceptGroups]);

  // Handle open concept selector
  const handleOpenConceptSelector = useCallback(() => {
    setShowConceptSelector(true);
    setConceptSelectorSearch("");
    setSelectedConceptsToAdd([]);
  }, []);

  // Handle concept selection in modal
  const handleToggleConceptSelection = useCallback((conceptId: string) => {
    setSelectedConceptsToAdd(prev => 
      prev.includes(conceptId)
        ? prev.filter(id => id !== conceptId)
        : [...prev, conceptId]
    );
  }, []);

  // Handle add concepts to group
  const handleAddConceptsToGroup = useCallback(async () => {
    if (!selectedGroup || selectedConceptsToAdd.length === 0) return;

    try {
      const response = await fetch(`/api/concept-groups/${selectedGroup.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptIds: selectedConceptsToAdd }),
      });

      if (response.ok) {
        await loadConceptGroups();
        // Update selected group to reflect changes
        const updatedGroup = {
          ...selectedGroup,
          memberConcepts: [...(selectedGroup.memberConcepts || []), ...selectedConceptsToAdd]
        };
        setSelectedGroup(updatedGroup);
        
        // Close modal and reset
        setShowConceptSelector(false);
        setSelectedConceptsToAdd([]);
        setConceptSelectorSearch("");
      }
    } catch (error) {
      console.error("Failed to add concepts to group:", error);
    }
  }, [selectedGroup, selectedConceptsToAdd, loadConceptGroups]);

  // Handle super group expand/collapse
  const handleToggleSuperGroup = useCallback((superGroupId: string) => {
    setExpandedSuperGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(superGroupId)) {
        newSet.delete(superGroupId);
      } else {
        newSet.add(superGroupId);
      }
      return newSet;
    });
  }, []);

  // Handle super group selection (for right panel display)
  const handleSuperGroupSelect = useCallback((superGroup: any) => {
    setSelectedGroup(superGroup);
    setIsEditingGroup(false);
    setEditGroupName(superGroup.name);
    setEditGroupDescription(superGroup.description || "");
    // Also toggle expand/collapse
    handleToggleSuperGroup(superGroup.id);
  }, [handleToggleSuperGroup]);

  // Handle open super group creator
  const handleOpenSuperGroupCreator = useCallback(() => {
    setShowSuperGroupCreator(true);
    setSuperGroupName("");
    setSuperGroupDescription("");
    setSelectedGroupsForSuperGroup([]);
  }, []);

  // Handle group selection for super group creation
  const handleToggleGroupForSuperGroup = useCallback((groupId: string) => {
    setSelectedGroupsForSuperGroup(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  }, []);

  // Handle create super group
  const handleCreateSuperGroup = useCallback(async () => {
    if (!superGroupName || selectedGroupsForSuperGroup.length === 0) return;

    try {
      // Calculate majority difficulty from selected groups
      const selectedGroups = conceptGroups.filter(group => 
        selectedGroupsForSuperGroup.includes(group.id)
      );
      const majorityDifficulty = calculateMajorityDifficultyFromGroups(selectedGroups);

      // Create the super group
      const response = await fetch("/api/concept-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: superGroupName,
          description: superGroupDescription || "Super group created to organize related concept groups",
          groupType: "mixed", // Super groups are always mixed
          level: 3, // Super group level
          difficulty: majorityDifficulty, // Calculated from child groups
          memberConcepts: [], // Super groups don't have direct concepts
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const superGroupId = result.data.id;
        console.log("🔧 DEBUG: Created supergroup with ID:", superGroupId);
        console.log("🔧 DEBUG: Selected groups for supergroup:", selectedGroupsForSuperGroup);

        // Update selected groups to be children of this super group
        const updateResults = await Promise.all(
          selectedGroupsForSuperGroup.map(async (groupId) => {
            console.log("🔧 DEBUG: Updating group", groupId, "to have parent", superGroupId);
            const updateResponse = await fetch(`/api/concept-groups/${groupId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                parentGroup: superGroupId,
              }),
            });
            const updateResult = await updateResponse.json();
            console.log("🔧 DEBUG: Update result for group", groupId, ":", updateResult);
            return updateResult;
          })
        );
        console.log("🔧 DEBUG: All update results:", updateResults);

        // Reset form and reload data
        setShowSuperGroupCreator(false);
        setSuperGroupName("");
        setSuperGroupDescription("");
        setSelectedGroupsForSuperGroup([]);
        await loadConceptGroups();

        // Auto-expand the new super group
        setExpandedSuperGroups(prev => new Set([...prev, superGroupId]));
      }
    } catch (error) {
      console.error("Failed to create super group:", error);
    }
  }, [superGroupName, superGroupDescription, selectedGroupsForSuperGroup, loadConceptGroups]);

  // Handle bulk merge
  const handleBulkMerge = useCallback(() => {
    if (selectedConcepts.length < 2) {
      alert("Please select at least 2 concepts to merge");
      return;
    }

    // Check if all concepts have the same category
    const selectedConceptsData = selectedConcepts.map(id => 
      concepts.find(c => c.id === id)
    ).filter(Boolean) as ConceptData[];

    const categories = [...new Set(selectedConceptsData.map(c => c.category))];
    if (categories.length > 1) {
      alert("Cannot merge concepts of different categories (Grammar and Vocabulary cannot be merged together)");
      return;
    }

    setShowMergeDialog(true);
  }, [selectedConcepts, concepts]);

  // Handle merge confirmation from dialog
  const handleMergeConfirmation = useCallback(async (mergeData: {
    primaryConceptId: string;
    secondaryConceptIds: string[];
    finalConceptData: any;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/concepts/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetConceptId: mergeData.primaryConceptId,
          sourceConceptIds: mergeData.secondaryConceptIds,
          finalConceptData: {
            name: mergeData.finalConceptData.name,
            category: mergeData.finalConceptData.category,
            description: mergeData.finalConceptData.description,
            examples: mergeData.finalConceptData.examples || [],
            sourceContent: mergeData.finalConceptData.sourceContent,
            confidence: mergeData.finalConceptData.confidence || 1.0,
            suggestedDifficulty: mergeData.finalConceptData.suggestedDifficulty,
            suggestedTags: mergeData.finalConceptData.suggestedTags || [],
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadConcepts();
        setSelectedConcepts([]);
        setShowMergeDialog(false);
        console.log("Concepts merged successfully");
      } else {
        console.error("Failed to merge concepts:", result.error);
        alert(`Failed to merge concepts: ${result.error}`);
      }
    } catch (error) {
      console.error("Error merging concepts:", error);
      alert(`Error merging concepts: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [loadConcepts]);

  // Handle bulk split
  const handleBulkSplit = useCallback(async () => {
    if (selectedConcepts.length !== 1) {
      alert("Please select exactly 1 concept to split");
      return;
    }

    const conceptId = selectedConcepts[0];
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return;

    const subconceptNames = prompt(
      "Enter names for subconcepts (comma-separated):",
      ""
    );
    if (!subconceptNames) return;

    const names = subconceptNames
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name);
    if (names.length < 2) {
      alert("Please provide at least 2 subconcept names");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/concepts/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceConceptId: conceptId,
          subconceptsData: names.map((name) => ({
            name,
            category: concept.category,
            description: `Split from: ${concept.name}`,
            difficulty: concept.difficulty,
            tags: [...concept.tags],
          })),
          preserveOriginal: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadConcepts();
        setSelectedConcepts([]);
        console.log("Concept split successfully");
      } else {
        console.error("Failed to split concept:", result.error);
      }
    } catch (error) {
      console.error("Error splitting concept:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedConcepts, concepts, loadConcepts]);

  // Handle bulk operations
  const handleBulkOperation = useCallback(
    async (operation: BulkOperation) => {
      try {
        const response = await fetch("/api/concepts/bulk-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(operation),
        });

        const result = await response.json();

        if (result.success && !operation.preview) {
          await loadConcepts();
          setSelectedConcepts([]);
        }

        return result;
      } catch (error) {
        console.error("Bulk operation failed:", error);
        throw error;
      }
    },
    [loadConcepts]
  );

  // Transform data for group-based visualization
  const mapData = useMemo(() => {
    const nodes = filteredConcepts.map((concept, index) => ({
      id: concept.id,
      name: concept.name,
      category: concept.category as "grammar" | "vocabulary",
      difficulty: concept.difficulty,
      x: 100 + (index % 15) * 80,
      y: 100 + Math.floor(index / 15) * 80,
      tags: concept.tags,
      isActive: concept.isActive,
    }));

    // Add group nodes
    const groupNodes = conceptGroups.map((group, index) => ({
      id: `group-${group.id}`,
      name: `📁 ${group.name}`,
      category: "group" as any,
      difficulty: group.difficulty,
      x: 50 + (index % 10) * 120,
      y: 50 + Math.floor(index / 10) * 120,
      tags: [],
      isActive: group.isActive,
      isGroup: true,
    }));

    // Create edges from groups to their member concepts
    const edges = conceptGroups.flatMap(group => 
      group.memberConcepts?.map((conceptId: string) => ({
        id: `${group.id}-${conceptId}`,
        source: `group-${group.id}`,
        target: conceptId,
        type: "membership"
      })) || []
    );

    return {
      nodes: [...groupNodes, ...nodes],
      edges,
    };
  }, [filteredConcepts, conceptGroups]);

  // Render dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <h1 className="mb-2 text-3xl font-bold">Concept Management Hub</h1>
        <p className="text-blue-100">
          Comprehensive concept organization, visualization, and intelligent
          management system
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center p-4">
              <BookOpen className="mr-3 size-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Concepts</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <Users className="mr-3 size-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.vocabulary}</div>
                <div className="text-sm text-gray-600">Vocabulary</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <Target className="mr-3 size-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.grammar}</div>
                <div className="text-sm text-gray-600">Grammar</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <TrendingUp className="mr-3 size-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.recentlyAdded}</div>
                <div className="text-sm text-gray-600">Added This Week</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Advanced Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search concepts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="vocabulary">Vocabulary</SelectItem>
                <SelectItem value="grammar">Grammar</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={difficultyFilter}
              onValueChange={setDifficultyFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
              </SelectContent>
            </Select>

            <MultiSelectDropdown
              options={allTags}
              selected={tagFilter}
              onChange={setTagFilter}
              placeholder="Tags"
            />

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setDifficultyFilter("all");
                setTagFilter([]);
              }}
            >
              Clear Filters
            </Button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredConcepts.length} of {concepts.length} concepts
          </div>
        </CardContent>
      </Card>

      {/* Tag-based Category Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="size-5" />
            Create Groups from Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!categoryCreationMode ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Group concepts into meaningful groups based on their tags.
                This helps organize related concepts automatically.
              </p>

              {stats && stats.topTags.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium">Most Popular Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.topTags.map(({ tag, count }) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => {
                          setSelectedTagsForCategory([tag]);
                          setCategoryCreationMode(true);
                        }}
                      >
                        {tag} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => setCategoryCreationMode(true)}>
                <Plus className="mr-2 size-4" />
                Create Group
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Group Name
                </label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter group name..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Select Tags
                </label>
                <div className="grid max-h-32 grid-cols-3 gap-2 overflow-y-auto">
                  {allTags.map((tag) => (
                    <label key={tag} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTagsForCategory.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTagsForCategory([
                              ...selectedTagsForCategory,
                              tag,
                            ]);
                          } else {
                            setSelectedTagsForCategory(
                              selectedTagsForCategory.filter((t) => t !== tag)
                            );
                          }
                        }}
                      />
                      <span className="text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedTagsForCategory.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Related Concepts (
                    {
                      concepts.filter((c) =>
                        c.tags.some((tag) =>
                          selectedTagsForCategory.includes(tag)
                        )
                      ).length
                    }
                    )
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {concepts
                      .filter((c) =>
                        c.tags.some((tag) =>
                          selectedTagsForCategory.includes(tag)
                        )
                      )
                      .map((concept) => (
                        <div
                          key={concept.id}
                          className="flex items-center gap-3 rounded border p-2 bg-blue-50 border-blue-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedConceptsForGroup.includes(concept.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedConceptsForGroup(prev => [...prev, concept.id]);
                              } else {
                                setSelectedConceptsForGroup(prev => prev.filter(id => id !== concept.id));
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{concept.name}</span>
                              <Badge
                                variant={
                                  concept.category === "grammar" ? "default" : "secondary"
                                }
                                className="text-xs"
                              >
                                {concept.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {concept.difficulty}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {concept.description}
                            </div>
                            {concept.tags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {concept.tags
                                  .filter(tag => selectedTagsForCategory.includes(tag))
                                  .slice(0, 3)
                                  .map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs bg-blue-100">
                                      {tag}
                                    </Badge>
                                  ))}
                                {concept.tags.filter(tag => selectedTagsForCategory.includes(tag)).length > 3 && (
                                  <Badge variant="outline" className="text-xs bg-blue-100">
                                    +{concept.tags.filter(tag => selectedTagsForCategory.includes(tag)).length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateCategoryFromTags}
                  disabled={
                    !newCategoryName || selectedConceptsForGroup.length === 0
                  }
                >
                  Create Group
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCategoryCreationMode(false);
                    setNewCategoryName("");
                    setSelectedTagsForCategory([]);
                    setSelectedConceptsForGroup([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Visualization */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Difficulty Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.byDifficulty).map(([level, count]) => (
                  <div
                    key={level}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{level}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full bg-blue-200"
                        style={{ width: `${(count / stats.total) * 100}px` }}
                      />
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5" />
                Source Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.bySource).map(([source, count]) => (
                  <div
                    key={source}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium capitalize">{source}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full bg-green-200"
                        style={{ width: `${(count / stats.total) * 100}px` }}
                      />
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  // Render LLM Explorer
  const renderLLMExplorer = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-5" />
            AI-Powered Concept Explorer
          </CardTitle>
          <p className="text-gray-600">
            Use natural language to explore concepts beyond just tags. Ask about
            themes, groups, or get recommendations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Exploration Query
              </label>
              <Textarea
                value={llmQuery}
                onChange={(e) => setLlmQuery(e.target.value)}
                placeholder="e.g., 'Find concepts related to daily conversations', 'What grammar concepts should I learn before past tense?', 'Show me vocabulary about food and cooking'"
                rows={3}
              />
            </div>

            <Button
              onClick={handleLLMExploration}
              disabled={isLoading || !llmQuery.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Exploring...
                </>
              ) : (
                <>
                  <Zap className="mr-2 size-4" />
                  Explore with AI
                </>
              )}
            </Button>
          </div>

          {llmResults && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="mb-2 font-medium text-blue-800">
                  Analysis Summary
                </h4>
                <p className="mb-2 text-sm text-blue-700">
                  {llmResults.categoryAnalysis}
                </p>
                <p className="text-sm text-blue-700">
                  {llmResults.difficultyAnalysis}
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Related Concepts</h4>
                <div className="space-y-2">
                  {llmResults.relatedConcepts.map((concept) => (
                    <div
                      key={concept.id}
                      className="flex items-center justify-between rounded bg-gray-50 p-3"
                    >
                      <div>
                        <span className="font-medium">{concept.name}</span>
                        <p className="text-sm text-gray-600">
                          {concept.reasoning}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(concept.similarity * 100)}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Suggested Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {llmResults.suggestedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Concept Detail View */}
      {selectedConcept && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Concept Details: {selectedConcept.name}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(!editMode)}
                >
                  <Edit className="size-4" />
                  {editMode ? "Cancel Edit" : "Edit"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedConcept(null);
                    setEditMode(false);
                  }}
                >
                  <Eye className="size-4" />
                  Close
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Name</label>
                  <Input
                    value={selectedConcept.name}
                    onChange={(e) =>
                      setSelectedConcept({
                        ...selectedConcept,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    value={selectedConcept.description}
                    onChange={(e) =>
                      setSelectedConcept({
                        ...selectedConcept,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Category
                    </label>
                    <Select
                      value={selectedConcept.category}
                      onValueChange={(value) =>
                        setSelectedConcept({
                          ...selectedConcept,
                          category: value as ConceptCategory,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grammar">Grammar</SelectItem>
                        <SelectItem value="vocabulary">Vocabulary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Difficulty
                    </label>
                    <Select
                      value={selectedConcept.difficulty}
                      onValueChange={(value) =>
                        setSelectedConcept({
                          ...selectedConcept,
                          difficulty: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="A2">A2</SelectItem>
                        <SelectItem value="B1">B1</SelectItem>
                        <SelectItem value="B2">B2</SelectItem>
                        <SelectItem value="C1">C1</SelectItem>
                        <SelectItem value="C2">C2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Tags</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            const newTag = (
                              e.target as HTMLInputElement
                            ).value.trim();
                            if (
                              newTag &&
                              !selectedConcept.tags.includes(newTag)
                            ) {
                              setSelectedConcept({
                                ...selectedConcept,
                                tags: [...selectedConcept.tags, newTag],
                              });
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          const input = (
                            e.target as HTMLButtonElement
                          ).parentElement?.querySelector("input");
                          if (input) {
                            const newTag = input.value.trim();
                            if (
                              newTag &&
                              !selectedConcept.tags.includes(newTag)
                            ) {
                              setSelectedConcept({
                                ...selectedConcept,
                                tags: [...selectedConcept.tags, newTag],
                              });
                              input.value = "";
                            }
                          }
                        }}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedConcept.tags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedConcept({
                              ...selectedConcept,
                              tags: selectedConcept.tags.filter(
                                (_, i) => i !== idx
                              ),
                            });
                          }}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const updateData = {
                          name: selectedConcept.name,
                          description: selectedConcept.description,
                          category: selectedConcept.category,
                          difficulty: selectedConcept.difficulty,
                          tags: selectedConcept.tags,
                        };

                        console.log("Updating concept with data:", updateData);

                        const response = await fetch(
                          `/api/concepts/${selectedConcept.id}`,
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify(updateData),
                          }
                        );

                        const result = await response.json();

                        if (result.success) {
                          // Update the concept in the local state
                          setConcepts((prev) =>
                            prev.map((c) =>
                              c.id === selectedConcept.id
                                ? { ...c, ...result.data }
                                : c
                            )
                          );
                          setEditMode(false);
                          console.log("Concept updated successfully");
                        } else {
                          console.error(
                            "Failed to update concept:",
                            result.error
                          );
                          console.error("Error details:", result.details);
                          alert(`Failed to update concept: ${result.error}`);
                        }
                      } catch (error) {
                        console.error("Error updating concept:", error);
                        alert(`Error updating concept: ${error}`);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-medium">Basic Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <Badge
                        variant={
                          selectedConcept.category === "grammar"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedConcept.category}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <Badge variant="outline">
                        {selectedConcept.difficulty}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Source:</span>
                      <span className="capitalize">
                        {selectedConcept.sourceType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <span>
                        {Math.round(selectedConcept.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">Description</h4>
                  <p className="text-gray-700">{selectedConcept.description}</p>

                  {selectedConcept.examples.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-medium">Examples</h4>
                      <ul className="list-inside list-disc space-y-1">
                        {selectedConcept.examples.map((example, idx) => (
                          <li key={idx} className="text-gray-700">
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedConcept.tags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-medium">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedConcept.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedConcept.vocabularyData && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-medium">Vocabulary Data</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">Word:</span>{" "}
                          {selectedConcept.vocabularyData.word}
                        </div>
                        <div>
                          <span className="font-medium">Translation:</span>{" "}
                          {selectedConcept.vocabularyData.translation}
                        </div>
                        <div>
                          <span className="font-medium">Part of Speech:</span>{" "}
                          {selectedConcept.vocabularyData.partOfSpeech}
                        </div>
                        {selectedConcept.vocabularyData.gender && (
                          <div>
                            <span className="font-medium">Gender:</span>{" "}
                            {selectedConcept.vocabularyData.gender}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render concept list with selection
  const renderConceptList = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Concepts ({filteredConcepts.length})</span>
          <div className="flex gap-2">
            {selectedConcepts.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedConcepts([])}
                >
                  Clear ({selectedConcepts.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkMerge()}
                  disabled={isLoading}
                >
                  <Merge className="mr-2 size-4" />
                  Merge
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkSplit()}
                  disabled={isLoading || selectedConcepts.length !== 1}
                >
                  <Split className="mr-2 size-4" />
                  Split
                </Button>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {filteredConcepts.map((concept) => (
              <div
                key={concept.id}
                className={`flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors hover:bg-gray-50 ${
                  selectedConcepts.includes(concept.id)
                    ? "border-blue-200 bg-blue-50"
                    : ""
                }`}
                onClick={() => toggleConceptSelection(concept.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedConcepts.includes(concept.id)}
                  onChange={() => toggleConceptSelection(concept.id)}
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-medium">{concept.name}</h4>
                    <Badge
                      variant={
                        concept.category === "grammar" ? "default" : "secondary"
                      }
                    >
                      {concept.category}
                    </Badge>
                    <Badge variant="outline">{concept.difficulty}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(concept.confidence * 100)}%
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 break-words">
                    {concept.description}
                  </p>

                  {concept.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {concept.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {concept.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{concept.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConcept(concept);
                      setActiveTab("explorer");
                    }}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConcept(concept);
                      setEditMode(true);
                      setActiveTab("explorer");
                    }}
                  >
                    <Edit className="size-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedConcept(concept);
                          setEditMode(true);
                          setActiveTab("explorer");
                        }}
                      >
                        <Edit className="mr-2 size-4" />
                        Edit Concept
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(concept.name);
                        }}
                      >
                        <Copy className="mr-2 size-4" />
                        Copy Name
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          const otherConcept = prompt(
                            "Enter ID of concept to merge with:"
                          );
                          if (otherConcept) {
                            setSelectedConcepts([concept.id, otherConcept]);
                            handleBulkMerge();
                          }
                        }}
                      >
                        <Merge className="mr-2 size-4" />
                        Merge with...
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedConcepts([concept.id]);
                          handleBulkSplit();
                        }}
                      >
                        <Split className="mr-2 size-4" />
                        Split Concept
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          console.log("Archive concept:", concept.name);
                        }}
                      >
                        <Archive className="mr-2 size-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          console.log("Delete concept:", concept.name);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          className="space-y-6"
        >
          {/* Tab Navigation */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="size-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="explorer" className="gap-2">
                <Brain className="size-4" />
                AI Explorer
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <Network className="size-4" />
                Concept Groups
              </TabsTrigger>
              <TabsTrigger value="bulk" className="gap-2">
                <Wand2 className="size-4" />
                Bulk Operations
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-2">
                <Upload className="size-4" />
                Import
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            {renderDashboard()}
            {renderConceptList()}
          </TabsContent>

          <TabsContent value="explorer">{renderLLMExplorer()}</TabsContent>

          <TabsContent value="map">
            <div className="h-[800px] flex gap-4">
              {/* Left Panel - Groups List */}
              <div className="w-1/3 bg-white rounded-lg shadow-sm border">
                {/* Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Groups ({filteredOrganizedGroups.superGroups.length + filteredOrganizedGroups.standaloneGroups.length})
                    </h3>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleOpenSuperGroupCreator}
                      >
                        <Plus className="size-4 mr-1" />
                        Super Group
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => setActiveTab("dashboard")}
                      >
                        <Plus className="size-4 mr-1" />
                        New Group
                      </Button>
                    </div>
                  </div>
                  
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search groups..."
                      value={groupSearchTerm}
                      onChange={(e) => setGroupSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filter */}
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="vocabulary">Vocabulary</SelectItem>
                      <SelectItem value="grammar">Grammar</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Groups Tree */}
                <ScrollArea className="h-[600px]">
                  <div className="p-2">
                    {filteredOrganizedGroups.superGroups.length === 0 && filteredOrganizedGroups.standaloneGroups.length === 0 ? (
                      <div className="text-center py-8">
                        <Network className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No groups found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {groupSearchTerm ? "Try different search terms" : "Create your first group from the Dashboard tab"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Supergroups Section */}
                        {filteredOrganizedGroups.superGroups.length > 0 && (
                          <div>
                            <div 
                              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50 rounded-md"
                              onClick={() => setSuperGroupsSectionExpanded(!superGroupsSectionExpanded)}
                            >
                              {superGroupsSectionExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="font-semibold text-sm text-gray-700">
                                Supergroups ({filteredOrganizedGroups.superGroups.length})
                              </span>
                            </div>
                            
                            {superGroupsSectionExpanded && (
                              <div className="ml-6 space-y-1">
                                {filteredOrganizedGroups.superGroups.map((superGroup) => (
                                  <div key={superGroup.id}>
                                    {/* Super Group Header */}
                                    <div
                                      className={`p-3 rounded-md cursor-pointer border transition-colors hover:bg-gray-50 ${
                                        selectedGroup?.id === superGroup.id ? "bg-purple-50 border-purple-200" : "border-transparent"
                                      }`}
                                      onClick={() => handleSuperGroupSelect(superGroup)}
                                    >
                                      <div className="flex items-start gap-2">
                                        <div className="flex items-center gap-1">
                                          {expandedSuperGroups.has(superGroup.id) ? (
                                            <div className="size-4 mt-1 text-purple-600">📁</div>
                                          ) : (
                                            <div className="size-4 mt-1 text-purple-600">📁</div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-sm truncate text-purple-800">{superGroup.name}</h4>
                                          <div className="flex items-center gap-1 mt-1">
                                            <Badge variant="outline" className="text-xs bg-purple-50">
                                              Super Group
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                              {superGroup.difficulty}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {superGroup.children.length} groups • {superGroup.totalConcepts} concepts
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Child Groups (shown when expanded) */}
                                    {expandedSuperGroups.has(superGroup.id) && (
                                      <div className="ml-6 mt-1 space-y-1">
                                        {superGroup.children.map((childGroup: any) => (
                                          <div
                                            key={childGroup.id}
                                            className={`p-2 rounded-md cursor-pointer border transition-colors hover:bg-gray-50 ${
                                              selectedGroup?.id === childGroup.id ? "bg-blue-50 border-blue-200" : "border-transparent"
                                            }`}
                                            onClick={() => handleGroupSelect(childGroup)}
                                          >
                                            <div className="flex items-start gap-2">
                                              <div className="size-4 mt-1 text-blue-600">📂</div>
                                              <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm truncate">{childGroup.name}</h4>
                                                <div className="flex items-center gap-1 mt-1">
                                                  <Badge variant="outline" className="text-xs">
                                                    {childGroup.groupType}
                                                  </Badge>
                                                  <Badge variant="secondary" className="text-xs">
                                                    {childGroup.difficulty}
                                                  </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                  {childGroup.memberConcepts?.length || 0} concepts
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Groups Section */}
                        {filteredOrganizedGroups.standaloneGroups.length > 0 && (
                          <div>
                            <div 
                              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50 rounded-md"
                              onClick={() => setGroupsSectionExpanded(!groupsSectionExpanded)}
                            >
                              {groupsSectionExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="font-semibold text-sm text-gray-700">
                                Groups ({filteredOrganizedGroups.standaloneGroups.length})
                              </span>
                            </div>
                            
                            {groupsSectionExpanded && (
                              <div className="ml-6 space-y-1">
                                {filteredOrganizedGroups.standaloneGroups.map((group) => (
                                  <div
                                    key={group.id}
                                    className={`p-3 rounded-md cursor-pointer border transition-colors hover:bg-gray-50 ${
                                      selectedGroup?.id === group.id ? "bg-blue-50 border-blue-200" : "border-transparent"
                                    }`}
                                    onClick={() => handleGroupSelect(group)}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="size-4 mt-1 text-blue-600">📂</div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">{group.name}</h4>
                                        <div className="flex items-center gap-1 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            {group.groupType}
                                          </Badge>
                                          <Badge variant="secondary" className="text-xs">
                                            {group.difficulty}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {group.memberConcepts?.length || 0} concepts
                                          {group.parentGroup && <span> • In supergroup</span>}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Right Panel - Group Details */}
              <div className="flex-1 bg-white rounded-lg shadow-sm border">
                {selectedGroup ? (
                  <div className="h-full flex flex-col">
                    {/* Group Header */}
                    <div className="p-6 border-b">
                      {isEditingGroup ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Group Name</label>
                            <Input
                              value={editGroupName}
                              onChange={(e) => setEditGroupName(e.target.value)}
                              placeholder="Enter group name..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <Textarea
                              value={editGroupDescription}
                              onChange={(e) => setEditGroupDescription(e.target.value)}
                              placeholder="Enter group description..."
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Difficulty Level</label>
                            <Select value={editGroupDifficulty} onValueChange={setEditGroupDifficulty}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A1">A1 - Beginner</SelectItem>
                                <SelectItem value="A2">A2 - Elementary</SelectItem>
                                <SelectItem value="B1">B1 - Intermediate</SelectItem>
                                <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                                <SelectItem value="C1">C1 - Advanced</SelectItem>
                                <SelectItem value="C2">C2 - Proficient</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-between">
                            <div className="flex gap-2">
                              <Button onClick={handleSaveGroup}>Save Changes</Button>
                              <Button variant="outline" onClick={() => setIsEditingGroup(false)}>
                                Cancel
                              </Button>
                            </div>
                            <Button variant="destructive" onClick={handleDeleteGroup}>
                              Delete {selectedGroup.level === 3 ? 'Supergroup' : 'Group'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {selectedGroup.level === 3 ? (
                                <span className="text-purple-600">📁</span>
                              ) : (
                                <span className="text-blue-600">📂</span>
                              )}
                              <h2 className="text-xl font-semibold">{selectedGroup.name}</h2>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={handleGroupEdit}>
                                <Edit className="size-4 mr-1" />
                                Edit
                              </Button>
                              {selectedGroup.level === 3 && (
                                <Button variant="outline" size="sm" onClick={handleManageGroups}>
                                  <Users className="size-4 mr-1" />
                                  Manage Groups
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3">{selectedGroup.description || "No description"}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {selectedGroup.level === 3 ? (
                              <>
                                <span>📁 {selectedGroup.children?.length || 0} groups</span>
                                <span>💡 {selectedGroup.totalConcepts || 0} total concepts</span>
                                <span>📂 Super Group</span>
                                <span>📊 {selectedGroup.difficulty} Level</span>
                              </>
                            ) : (
                              <>
                                <span>💡 {selectedGroup.memberConcepts?.length || 0} concepts</span>
                                <span>📂 {selectedGroup.groupType}</span>
                                <span>📊 {selectedGroup.difficulty} Level</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6">
                      {selectedGroup.level === 3 ? (
                        /* Super Group Content */
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">Child Groups</h3>
                          </div>

                          {selectedGroup.children?.length === 0 ? (
                            <div className="text-center py-8">
                              <Network className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No child groups yet</h3>
                              <p className="mt-1 text-sm text-gray-500">Create groups and organize them into this super group</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {selectedGroup.children?.map((childGroup: any) => (
                                <div
                                  key={childGroup.id}
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                  onClick={() => handleGroupSelect(childGroup)}
                                >
                                  <span className="text-blue-600">📂</span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{childGroup.name}</h4>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {childGroup.groupType}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {childGroup.difficulty}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{childGroup.description || "No description"}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {childGroup.memberConcepts?.length || 0} concepts
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Regular Group Content */
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">Concepts in this Group</h3>
                            <Button variant="outline" size="sm" onClick={handleOpenConceptSelector}>
                              <Plus className="size-4 mr-1" />
                              Add Concepts
                            </Button>
                          </div>

                          {selectedGroup.memberConcepts?.length === 0 ? (
                            <div className="text-center py-8">
                              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No concepts yet</h3>
                              <p className="mt-1 text-sm text-gray-500">Add concepts to organize them in this group</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {selectedGroup.memberConcepts?.map((conceptId: string) => {
                                const concept = concepts.find(c => c.id === conceptId);
                                if (!concept) return null;
                                
                                return (
                                  <div
                                    key={conceptId}
                                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium">{concept.name}</h4>
                                        <Badge
                                          variant={concept.category === "grammar" ? "default" : "secondary"}
                                          className="text-xs"
                                        >
                                          {concept.category}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {concept.difficulty}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">{concept.description}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveConceptFromGroup(conceptId)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Network className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Select a group</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Choose a group from the left panel to view and manage its concepts
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>


          <TabsContent value="bulk">
            <BulkOperationsPanel
              selectedConcepts={
                selectedConcepts
                  .map((id) => {
                    const concept = concepts.find((c) => c.id === id);
                    return concept
                      ? {
                          id: concept.id,
                          name: concept.name,
                          category: concept.category,
                          difficulty: concept.difficulty,
                          tags: concept.tags,
                        }
                      : null;
                  })
                  .filter(Boolean) as BulkConcept[]
              }
              onExecuteOperation={handleBulkOperation}
              onConceptSelect={setSelectedConcepts}
            />
          </TabsContent>

          <TabsContent value="import">
            <ConceptImporter
              onImportComplete={(result) => {
                if (result.success) {
                  loadConcepts();
                }
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Merge Dialog */}
        {showMergeDialog && (
          <MergeConceptDialog
            isOpen={showMergeDialog}
            selectedConcepts={selectedConcepts.map(id => {
              const concept = concepts.find(c => c.id === id);
              return concept ? {
                id: concept.id,
                name: concept.name,
                category: concept.category,
                difficulty: concept.difficulty,
                tags: concept.tags,
                isActive: concept.isActive,
                lastUpdated: concept.lastUpdated,
              } : null;
            }).filter(Boolean) as any[]}
            availableTags={allTags}
            onConfirmMerge={handleMergeConfirmation}
            onCancel={() => setShowMergeDialog(false)}
          />
        )}

        {/* Concept Selector Modal */}
        {showConceptSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg w-[600px] max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Add Concepts to {selectedGroup?.name}</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowConceptSelector(false)}
                  >
                    ✕
                  </Button>
                </div>
                
                {/* Search */}
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search concepts..."
                    value={conceptSelectorSearch}
                    onChange={(e) => setConceptSelectorSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[400px] overflow-y-auto">
                {availableConceptsForGroup.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {conceptSelectorSearch ? "No concepts found" : "All concepts are already in this group"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {conceptSelectorSearch ? "Try different search terms" : "Create more concepts to add them here"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableConceptsForGroup.map((concept) => (
                      <div
                        key={concept.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                          selectedConceptsToAdd.includes(concept.id) ? "bg-blue-50 border-blue-200" : ""
                        }`}
                        onClick={() => handleToggleConceptSelection(concept.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedConceptsToAdd.includes(concept.id)}
                          onChange={() => handleToggleConceptSelection(concept.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{concept.name}</h4>
                            <Badge
                              variant={concept.category === "grammar" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {concept.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {concept.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 truncate">{concept.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedConceptsToAdd.length} concept{selectedConceptsToAdd.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowConceptSelector(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddConceptsToGroup}
                      disabled={selectedConceptsToAdd.length === 0}
                    >
                      Add {selectedConceptsToAdd.length} Concept{selectedConceptsToAdd.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Super Group Creator Modal */}
        {showSuperGroupCreator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg w-[700px] max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Create Super Group</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowSuperGroupCreator(false)}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[500px] overflow-y-auto">
                <div className="space-y-4">
                  {/* Super Group Details */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Super Group Name</label>
                    <Input
                      value={superGroupName}
                      onChange={(e) => setSuperGroupName(e.target.value)}
                      placeholder="Enter super group name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                    <Textarea
                      value={superGroupDescription}
                      onChange={(e) => setSuperGroupDescription(e.target.value)}
                      placeholder="Enter super group description..."
                      rows={3}
                    />
                  </div>

                  {/* Group Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Groups to Include ({selectedGroupsForSuperGroup.length} selected)
                    </label>
                    
                    {/* Available Groups (only standalone groups) */}
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                      {filteredOrganizedGroups.standaloneGroups.length === 0 ? (
                        <div className="text-center py-4">
                          <Network className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            No standalone groups available. Create some groups first.
                          </p>
                        </div>
                      ) : (
                        filteredOrganizedGroups.standaloneGroups.map((group) => (
                          <div
                            key={group.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                              selectedGroupsForSuperGroup.includes(group.id) ? "bg-purple-50 border-purple-200" : ""
                            }`}
                            onClick={() => handleToggleGroupForSuperGroup(group.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedGroupsForSuperGroup.includes(group.id)}
                              onChange={() => handleToggleGroupForSuperGroup(group.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-blue-600">📂</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{group.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {group.groupType}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {group.difficulty}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 truncate">{group.description || "No description"}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {group.memberConcepts?.length || 0} concepts
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedGroupsForSuperGroup.length} group{selectedGroupsForSuperGroup.length !== 1 ? 's' : ''} will be organized into this super group
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSuperGroupCreator(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateSuperGroup}
                      disabled={!superGroupName || selectedGroupsForSuperGroup.length === 0}
                    >
                      Create Super Group
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Groups Modal for Supergroups */}
        {showManageGroups && selectedGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold">Manage Groups in {selectedGroup.name}</h2>
                  <p className="text-gray-600 mt-1">Add or remove groups from this supergroup</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Groups */}
                    <div>
                      <h3 className="font-medium mb-3">Current Groups ({selectedGroup.children?.length || 0})</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedGroup.children?.map((group: any) => (
                          <div key={group.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="font-medium">{group.name}</h4>
                              <p className="text-sm text-gray-500">{group.memberConcepts?.length || 0} concepts</p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRemoveGroupFromSupergroup(group.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        {(!selectedGroup.children || selectedGroup.children.length === 0) && (
                          <p className="text-gray-500 text-center py-4">No groups in this supergroup</p>
                        )}
                      </div>
                    </div>

                    {/* Available Groups */}
                    <div>
                      <h3 className="font-medium mb-3">Available Groups ({availableGroupsForSupergroup.filter(g => !g.parentGroup && !selectedGroup.children?.some((child: any) => child.id === g.id)).length})</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableGroupsForSupergroup.filter(group => !group.parentGroup && !selectedGroup.children?.some((child: any) => child.id === group.id)).map((group) => (
                          <div key={group.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="font-medium">{group.name}</h4>
                              <p className="text-sm text-gray-500">{group.memberConcepts?.length || 0} concepts • {group.difficulty}</p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddGroupToSupergroup(group.id)}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                        {availableGroupsForSupergroup.filter(g => !g.parentGroup && !selectedGroup.children?.some((child: any) => child.id === g.id)).length === 0 && (
                          <p className="text-gray-500 text-center py-4">No available groups to add</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t">
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowManageGroups(false)}>
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
