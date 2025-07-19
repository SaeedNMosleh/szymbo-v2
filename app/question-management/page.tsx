"use client";

import { useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import QuestionGenerationPlanner from "@/components/Features/questionManagement/QuestionGenerationPlanner";
import QuestionDraftReview from "@/components/Features/questionManagement/QuestionDraftReview";
import QuestionCoverageDashboard from "@/components/Features/questionManagement/QuestionCoverageDashboard";
import QuestionEditor from "@/components/Features/questionManagement/QuestionEditor";

export default function QuestionManagementPage() {
  const [activeTab, setActiveTab] = useState("planner");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Question Management Hub
          </h1>
          <p className="text-muted-foreground">
            Centralized system for generating, reviewing, and managing practice
            questions
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="planner">Generation Planner</TabsTrigger>
            <TabsTrigger value="drafts">Draft Review</TabsTrigger>
            <TabsTrigger value="coverage">Coverage Dashboard</TabsTrigger>
            <TabsTrigger value="editor">Manual Question Adding</TabsTrigger>
          </TabsList>

          <TabsContent value="planner" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Question Generation Planner</CardTitle>
                <CardDescription>
                  Plan and generate batches of questions for selected concepts
                  and types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionGenerationPlanner
                  onGenerationComplete={handleRefreshData}
                  onSwitchToDrafts={() => setActiveTab("drafts")}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Draft Question Review</CardTitle>
                <CardDescription>
                  Review all draft questions (generated and manual) before
                  saving to question bank
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionDraftReview
                  refreshTrigger={refreshTrigger}
                  onApprovalComplete={handleRefreshData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coverage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Question Coverage Dashboard</CardTitle>
                <CardDescription>
                  Visual analysis of question coverage across concepts and types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionCoverageDashboard refreshTrigger={refreshTrigger} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual Question Adding</CardTitle>
                <CardDescription>
                  Create questions manually and add them to the draft review
                  queue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionEditor onQuestionSaved={handleRefreshData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
