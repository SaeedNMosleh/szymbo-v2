"use client";

import { useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Settings,
  BarChart3,
  FileText,
  Database,
  Plus,
  Filter,
  ChevronRight,
} from "lucide-react";
import QuestionGenerationPlanner from "@/components/Features/questionManagement/QuestionGenerationPlanner";
import QuestionDraftReview from "@/components/Features/questionManagement/QuestionDraftReview";
import QuestionCoverageDashboard from "@/components/Features/questionManagement/QuestionCoverageDashboard";
import QuestionEditor from "@/components/Features/questionManagement/QuestionEditor";
import QuestionBankManager from "@/components/Features/questionManagement/QuestionBankManager";

const navigationItems = [
  {
    id: "planner",
    label: "Generation Planner",
    icon: Settings,
    description: "Plan and generate questions",
  },
  {
    id: "drafts",
    label: "Draft Review",
    icon: FileText,
    description: "Review generated questions",
  },
  {
    id: "coverage",
    label: "Coverage Dashboard",
    icon: BarChart3,
    description: "Analyze question coverage",
  },
  {
    id: "editor",
    label: "Manual Editor",
    icon: Plus,
    description: "Create questions manually",
  },
  {
    id: "management",
    label: "Question Bank",
    icon: Database,
    description: "Manage all questions",
  },
];

export default function QuestionManagementPage() {
  const [activeTab, setActiveTab] = useState("planner");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleRefreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const activeNavItem = navigationItems.find((item) => item.id === activeTab);

  return (
    <>
      <Navigation />
      <div className="flex h-screen bg-gray-50/50">
        {/* Sidebar */}
        <div
          className={`${sidebarCollapsed ? "w-16" : "w-80"} flex flex-col border-r border-gray-200 bg-white transition-all duration-300`}
        >
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Question Hub
                  </h2>
                  <p className="text-sm text-gray-500">Management Center</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="size-8 p-0"
              >
                <ChevronRight
                  className={`size-4 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
                />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`mb-1 h-auto w-full justify-start p-3 ${
                      isActive ? "border-blue-200 bg-blue-50 text-blue-700" : ""
                    }`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon className="mr-3 size-4 shrink-0" />
                    {!sidebarCollapsed && (
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Quick Stats */}
          {!sidebarCollapsed && (
            <div className="border-t border-gray-200 bg-gray-50/50 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Concepts</span>
                  <Badge variant="secondary">52</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Draft Questions</span>
                  <Badge variant="outline">12</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Questions</span>
                  <Badge variant="default">1,247</Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Compact Header */}
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {activeNavItem && (
                  <>
                    <activeNavItem.icon className="size-6 text-blue-600" />
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        {activeNavItem.label}
                      </h1>
                      <p className="text-sm text-gray-500">
                        {activeNavItem.description}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 size-4" />
                  Filters
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="mr-2 size-4" />
                  Search
                </Button>
                <Button size="sm">
                  <Plus className="mr-2 size-4" />
                  Quick Add
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {activeTab === "planner" && (
                <QuestionGenerationPlanner
                  onGenerationComplete={handleRefreshData}
                  onSwitchToDrafts={() => setActiveTab("drafts")}
                />
              )}

              {activeTab === "drafts" && (
                <QuestionDraftReview
                  refreshTrigger={refreshTrigger}
                  onApprovalComplete={handleRefreshData}
                />
              )}

              {activeTab === "coverage" && (
                <QuestionCoverageDashboard refreshTrigger={refreshTrigger} />
              )}

              {activeTab === "editor" && (
                <QuestionEditor onQuestionSaved={handleRefreshData} />
              )}

              {activeTab === "management" && <QuestionBankManager />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
