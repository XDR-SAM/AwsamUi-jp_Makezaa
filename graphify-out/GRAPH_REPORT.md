# Graph Report - AwsamUi-jp_Makezaa  (2026-06-07)

## Corpus Check
- 119 files · ~30,978 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 719 nodes · 1229 edges · 47 communities (41 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e093c730`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 275 edges
2. `createAdminClient()` - 27 edges
3. `compilerOptions` - 16 edges
4. `createClient()` - 14 edges
5. `Button()` - 10 edges
6. `buttonVariants` - 9 edges
7. `tailwind` - 6 edges
8. `aliases` - 6 edges
9. `FooterSection()` - 6 edges
10. `Navigation()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `AdminProjectsPage()` --calls--> `getAllProjects()`  [INFERRED]
  app/admin/(protected)/projects/page.tsx → lib/projects.ts
- `AlertDialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `AlertDialogContent()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `AlertDialogHeader()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `AlertDialogFooter()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (47 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (64): dependencies, autoprefixer, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, geist (+56 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (5): Checkbox(), Progress(), Slider(), Spinner(), Switch()

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (36): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (41): useIsMobile(), Input(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay() (+33 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (28): cn(), AccordionContent(), AccordionItem(), AccordionTrigger(), Avatar(), AvatarFallback(), AvatarImage(), Kbd() (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (22): Field(), FieldContent(), FieldDescription(), FieldError(), FieldGroup(), FieldLabel(), FieldLegend(), FieldSeparator() (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (21): CtaSection(), DevelopersSection(), features, features, FeaturesSection(), HeroSection(), words, HowItWorksSection() (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (15): Command(), CommandDialog(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator(), CommandShortcut() (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (17): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, Item(), ItemActions(), ItemContent(), ItemDescription() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (8): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), THEMES, useChart()

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (7): SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger()

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (7): AlertDialogAction(), AlertDialogCancel(), Button(), buttonVariants, Calendar(), CalendarDayButton(), PaginationLink()

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (12): skills, supabase, supabase-postgres-best-practices, computedHash, computedHash, skillPath, source, sourceType (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (6): AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay(), AlertDialogTitle()

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (6): Pagination(), PaginationContent(), PaginationEllipsis(), PaginationLinkProps, PaginationNext(), PaginationPrevious()

### Community 23 - "Community 23"
Cohesion: 0.29
Nodes (7): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle()

### Community 24 - "Community 24"
Cohesion: 0.24
Nodes (9): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea() (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (4): instrumentSans, instrumentSerif, jetbrainsMono, metadata

### Community 26 - "Community 26"
Cohesion: 0.53
Nodes (4): config, middleware(), createClient(), updateSession()

### Community 27 - "Community 27"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 28 - "Community 28"
Cohesion: 0.09
Nodes (28): generateMetadata(), generateMetadata(), BlogPage(), metadata, CmsContent(), CmsContentProps, footerLinks, FooterSection() (+20 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (9): devDependencies, postcss, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/node, @types/react, @types/react-dom (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (7): Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle()

### Community 31 - "Community 31"
Cohesion: 0.06
Nodes (45): DeleteItemButton(), DeleteItemButtonProps, ImageUploader(), ImageUploaderProps, PostEditor(), PostEditorProps, ProjectEditor(), ProjectEditorProps (+37 more)

### Community 34 - "Community 34"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 35 - "Community 35"
Cohesion: 0.31
Nodes (3): AdminSidebar(), nav, createClient()

### Community 42 - "Community 42"
Cohesion: 0.40
Nodes (3): InputOTP(), InputOTPGroup(), InputOTPSlot()

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (7): Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator()

## Knowledge Gaps
- **183 isolated node(s):** `metadata`, `instrumentSans`, `instrumentSerif`, `jetbrainsMono`, `metadata` (+178 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 4` to `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 7`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 27`, `Community 28`, `Community 30`, `Community 34`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 46`?**
  _High betweenness centrality (0.452) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Community 31` to `Community 35`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `createAdminClient()` (e.g. with `DELETE()` and `PUT()`) actually correct?**
  _`createAdminClient()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `metadata`, `instrumentSans`, `instrumentSerif` to the rest of the system?**
  _183 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03125 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06968641114982578 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05203619909502263 - nodes in this community are weakly interconnected._