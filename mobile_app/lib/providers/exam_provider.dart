import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/exam.dart';
import '../models/question.dart';
import '../models/result.dart';

class ExamProvider with ChangeNotifier {
  List<Exam> _exams = [];
  List<Question> _questions = [];
  List<Result> _results = [];
  bool _isLoading = false;

  List<Exam> get exams => _exams;
  List<Question> get questions => _questions;
  List<Result> get results => _results;
  bool get isLoading => _isLoading;

  final _supabase = Supabase.instance.client;

  /// Check if we're in demo mode (no Supabase auth session)
  bool get _isDemoMode => _supabase.auth.currentUser == null;

  // ── Demo data store ──
  final Set<int> _demoCompletedExamIds = {};
  final List<Result> _demoResults = [];

  StreamSubscription<List<Map<String, dynamic>>>? _examSubscription;
  StreamSubscription<List<Map<String, dynamic>>>? _resultSubscription;

  /// Initiate realtime streams for exams and results.
  /// RLS handles the filtering automatically.
  void initStreams() {
    initExamStream();
    initResultStream();
  }

  void initExamStream() {
    _isLoading = true;
    notifyListeners();

    _examSubscription?.cancel();

    _examSubscription = _supabase
        .from('exams')
        .stream(primaryKey: ['id'])
        .order('start_date', ascending: false)
        .listen((data) async {
          final userId = _supabase.auth.currentUser?.id;

          // Fetch related modules to populate moduleTitle and divisionName
          final Set<int> moduleIds = data.map((e) => e['module_id'] as int).toSet();
          final Map<int, Map<String, String>> moduleDetails = {};
          
          if (moduleIds.isNotEmpty) {
            final modulesData = await _supabase
                .from('modules')
                .select('id, title, division:divisions(name)')
                .inFilter('id', moduleIds.toList());
                
            for (var m in modulesData) {
               final title = m['title'] as String;
               String divName = 'Umum';
               if (m['division'] != null && m['division'] is Map) {
                   divName = m['division']['name'] as String;
               }
               moduleDetails[m['id'] as int] = {
                 'title': title,
                 'divisionName': divName,
               };
            }
          }

          List<int> completedExamIds = [];
          if (userId != null) {
            // Also need to know which ones are completed
            final resultsData = await _supabase
                .from('results')
                .select('exam_id')
                .eq('user_id', userId);
            completedExamIds =
                (resultsData as List).map<int>((r) => r['exam_id'] as int).toList();
          } else {
            completedExamIds = _demoCompletedExamIds.toList();
          }

          _exams = data.map((json) {
            json['has_result'] = completedExamIds.contains(json['id']);
            // Manually inject moduleTitle and divisionName
            if (moduleDetails.containsKey(json['module_id'])) {
               json['module'] = {
                 'title': moduleDetails[json['module_id']]!['title'],
                 'division': { 'name': moduleDetails[json['module_id']]!['divisionName'] }
               };
            }
            return Exam.fromJson(json);
          }).toList();
          
          _isLoading = false;
          notifyListeners();
        }, onError: (error) {
          debugPrint('Error in exam stream: $error');
          _isLoading = false;
          notifyListeners();
        });
  }

  /// Fetch questions for a specific exam (via its module_id)
  Future<void> fetchQuestions(int moduleId) async {
    _isLoading = true;
    notifyListeners();

    if (_isDemoMode) {
      // Instead of demo UI data, let's still try to fetch real data
    }

    try {
      final data = await _supabase
          .from('questions')
          .select()
          .eq('module_id', moduleId);

      _questions =
          (data as List).map((json) => Question.fromJson(json)).toList();
    } catch (e) {
      debugPrint('Error fetching questions: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Submit exam answers, calculate weighted score, and insert result.
  Future<double> submitExam(int examId, Map<int, String> answers) async {
    // Calculate weighted score
    int totalWeight = 0;
    int earnedWeight = 0;

    for (final q in _questions) {
      totalWeight += q.weight;
      if (answers[q.id] == q.correctAns) {
        earnedWeight += q.weight;
      }
    }

    final score =
        totalWeight > 0 ? (earnedWeight / totalWeight) * 100.0 : 0.0;

    if (_isDemoMode) {
      // Store demo result locally
      _demoCompletedExamIds.add(examId);
      final exam = _exams.firstWhere((e) => e.id == examId);
      _demoResults.insert(
        0,
        Result(
          id: _demoResults.length + 1,
          userId: 'demo-user',
          examId: examId,
          score: score,
          isPassed: score >= 75.0,
          finishedAt: DateTime.now(),
          examTitle: exam.title,
          moduleTitle: exam.moduleTitle,
          userAnswers: answers,
        ),
      );
      return score;
    }

    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Tidak terautentikasi');

    final jsonAnswers = answers.map((k, v) => MapEntry(k.toString(), v));

    await _supabase.from('results').insert({
      'user_id': userId,
      'exam_id': examId,
      'score': score,
      'user_answers': jsonAnswers,
    });

    // Streams are active, we don't need to manually fetch anymore
    // fetchExams();
    // fetchResults();

    return score;
  }

  /// Initiate realtime string for results
  void initResultStream() {
    _isLoading = true;
    notifyListeners();

    _resultSubscription?.cancel();

    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      _results = _demoResults;
      _isLoading = false;
      notifyListeners();
      return;
    }

    _resultSubscription = _supabase
        .from('results')
        .stream(primaryKey: ['id'])
        .eq('user_id', userId)
        .order('finished_at', ascending: false)
        .listen((data) async {
          
          // Fetch related exam and module data to populate titles
          final Set<int> examIds = data.map((e) => e['exam_id'] as int).toSet();
          final Map<int, String> examTitles = {};
          final Map<int, String> moduleTitles = {};
          
          if (examIds.isNotEmpty) {
             final examsData = await _supabase
                .from('exams')
                .select('id, title, module:modules(title)')
                .inFilter('id', examIds.toList());
             
             for (var e in examsData) {
                final examId = e['id'] as int;
                examTitles[examId] = e['title'] as String;
                if (e['module'] != null) {
                   moduleTitles[examId] = e['module']['title'] as String;
                }
             }
          }

          _results = data.map((json) {
            final examId = json['exam_id'] as int;
            if (examTitles.containsKey(examId)) {
               json['exam'] = {
                 'title': examTitles[examId],
                 'module': moduleTitles.containsKey(examId) ? {'title': moduleTitles[examId]} : null,
               };
            }
            return Result.fromJson(json);
          }).toList();
          
          _isLoading = false;
          notifyListeners();
        }, onError: (error) {
          debugPrint('Error in result stream: $error');
          _isLoading = false;
          notifyListeners();
        });
  }

  @override
  void dispose() {
    _examSubscription?.cancel();
    _resultSubscription?.cancel();
    super.dispose();
  }
}
