import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../providers/exam_provider.dart';
import '../providers/module_provider.dart';
import 'module_detail_screen.dart';

class ExamListScreen extends StatefulWidget {
  const ExamListScreen({super.key});

  @override
  State<ExamListScreen> createState() => _ExamListScreenState();
}

class _ExamListScreenState extends State<ExamListScreen> {
  String searchQuery = '';

  @override
  void initState() {
    super.initState();
    final examProv = Provider.of<ExamProvider>(context, listen: false);
    final moduleProv = Provider.of<ModuleProvider>(context, listen: false);
    Future.microtask(() {
      examProv.initStreams();
      moduleProv.initModuleStream();
    });
  }

  @override
  Widget build(BuildContext context) {
    final moduleProv = Provider.of<ModuleProvider>(context);
    final examProv = Provider.of<ExamProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final colorScheme = theme.colorScheme;

    final filteredModules = moduleProv.modules.where((module) {
      final matchesSearch = module.title.toLowerCase().contains(searchQuery.toLowerCase()) ||
          (module.description?.toLowerCase().contains(searchQuery.toLowerCase()) ?? false);
      return matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Header Section
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (Navigator.canPop(context)) ...[
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.arrow_back),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                        const SizedBox(width: 16),
                      ],
                      const Text(
                        'Daftar Pelatihan',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                    decoration: BoxDecoration(
                      color: isDark ? colorScheme.surface : Colors.grey[100],
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isDark ? Colors.grey[800]! : Colors.transparent),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.search, color: Colors.grey[500]),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            onChanged: (value) {
                              setState(() {
                                searchQuery = value;
                              });
                            },
                            decoration: InputDecoration(
                              hintText: 'Cari course atau materi...',
                              hintStyle: TextStyle(color: Colors.grey[500]),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // 2. Course Cards GridView
            Expanded(
              child: moduleProv.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : filteredModules.isEmpty
                      ? const Center(
                          child: Text(
                            'Belum ada modul pelatihan.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.fromLTRB(24, 0, 24, 100),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.85,
                          ),
                          itemCount: filteredModules.length,
                          itemBuilder: (context, index) {
                            final module = filteredModules[index];
                            
                            // Check quizzes for this module
                            final moduleExams = examProv.exams.where((e) => e.moduleId == module.id).toList();
                            final examCount = moduleExams.length;
                            final totalQuestions = moduleExams.fold<int>(0, (sum, e) => sum + (e.questionCount ?? 0));

                            // Determine file type badge
                            final fileType = (module.fileType ?? 'pdf').toLowerCase();
                            final badgeColor = fileType == 'video' ? Colors.orange : theme.primaryColor;
                            final badgeText = fileType.toUpperCase();

                            return Card(
                              elevation: 0,
                              color: Colors.transparent,
                              margin: EdgeInsets.zero,
                              child: InkWell(
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => ModuleDetailScreen(module: module),
                                    ),
                                  );
                                },
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: theme.cardTheme.color,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: isDark ? Colors.grey[800]! : Colors.grey.shade200),
                                    boxShadow: isDark ? [] : [
                                      BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      // Inner-Top Gradient Container
                                      Expanded(
                                        flex: 6,
                                        child: Stack(
                                          children: [
                                            module.imageUrl != null && module.imageUrl!.isNotEmpty
                                                ? ClipRRect(
                                                    borderRadius: const BorderRadius.only(
                                                      topLeft: Radius.circular(16),
                                                      topRight: Radius.circular(16),
                                                    ),
                                                    child: CachedNetworkImage(
                                                      imageUrl: Supabase.instance.client.storage.from('modules').getPublicUrl(module.imageUrl!),
                                                      fit: BoxFit.cover,
                                                      width: double.infinity,
                                                      height: double.infinity,
                                                      placeholder: (context, url) => Container(
                                                        color: isDark ? Colors.grey[800] : Colors.grey[200],
                                                        child: const Center(child: CircularProgressIndicator()),
                                                      ),
                                                      errorWidget: (context, url, error) => Container(
                                                        color: isDark ? Colors.grey[800] : Colors.grey[300],
                                                        child: const Icon(Icons.broken_image, color: Colors.grey),
                                                      ),
                                                    ),
                                                  )
                                                : Container(
                                                    decoration: BoxDecoration(
                                                      gradient: LinearGradient(
                                                        begin: Alignment.topLeft,
                                                        end: Alignment.bottomRight,
                                                        colors: [
                                                          badgeColor.withOpacity(0.2),
                                                          badgeColor.withOpacity(0.02),
                                                        ],
                                                      ),
                                                      borderRadius: const BorderRadius.only(
                                                        topLeft: Radius.circular(16),
                                                        topRight: Radius.circular(16),
                                                      ),
                                                    ),
                                                    child: Center(
                                                      child: Icon(
                                                        fileType == 'video' ? Icons.play_circle_filled_rounded : Icons.library_books_rounded,
                                                        size: 40,
                                                        color: badgeColor,
                                                      ),
                                                    ),
                                                  ),
                                            Positioned(
                                              top: 8,
                                              right: 8,
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: badgeColor,
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  badgeText,
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      // Inner-Bottom Content Container
                                      Expanded(
                                        flex: 5,
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                module.title,
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
                                                  height: 1.2,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              if (module.description != null && module.description!.isNotEmpty)
                                                Expanded(
                                                  child: Text(
                                                    module.description!,
                                                    maxLines: 2,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: TextStyle(
                                                      fontSize: 10,
                                                      color: Colors.grey[500],
                                                    ),
                                                  ),
                                                ),
                                              if (module.description == null || module.description!.isEmpty)
                                                const Spacer(),
                                              Row(
                                                children: [
                                                  Icon(Icons.assignment_rounded, size: 12, color: theme.primaryColor),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    '$examCount Kuis',
                                                    style: TextStyle(
                                                      fontSize: 10, 
                                                      color: isDark ? Colors.white70 : Colors.black87,
                                                      fontWeight: FontWeight.w600
                                                    ),
                                                  ),
                                                  const SizedBox(width: 6),
                                                  Text(
                                                    '•', 
                                                    style: TextStyle(color: Colors.grey[400], fontSize: 10)
                                                  ),
                                                  const SizedBox(width: 6),
                                                  Text(
                                                    '$totalQuestions Soal',
                                                    style: TextStyle(
                                                      fontSize: 10, 
                                                      color: Colors.grey[600], 
                                                      fontWeight: FontWeight.w500
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
