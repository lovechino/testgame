{
  "sdkVersion": "1.0.0",
  "source": "simulator",
  "sessionId": "u6ak7u61c3krc2wnc1",
  "gameId": "com.iruka.puzzles-colors-g-game",
  "lessonId": "lessonId",
  "gameVersion": "1.0.0",
  "type": "COMPLETE",
  "payload": {
    "timeMs": 51876,
    "score": 4,
    "extras": {
      "reason": "user_exit",
      "session_summary": {
        "selection_phase": {
          "action": "chọn đúng con vật",
          "is_correct": true,
          "time_spent": 0
        },
        "painting_phase": {
          "Shape_02": {
            "spills_pixels": 0,
            "hints_used": 0,
            "completed": true
          },
          "Char_01": {
            "spills_pixels": 0,
            "hints_used": 0,
            "completed": true
          },
          "Shape_01": {
            "spills_pixels": 0,
            "hints_used": 0,
            "completed": true
          }
        }
      },
      "stats": {
        "accuracy": 1,
        "completion": 1,
        "hintCount": 2,
        "mistakeCount": 0,
        "retryCount": 2,
        "outcome": "quit",
        "finalScore": 4,
        "bestScore": 4,
        "completion_history": [
          {
            "attemptIndex": 1,
            "correct": 7,
            "wrong": 0,
            "total": 3,
            "completion": 1,
            "accuracy": 1,
            "finalScore": 7,
            "startedAtMs": 539.6999999955297,
            "outcome": "pass",
            "questionDurationsMs": [
              396.1000000014901,
              14407.69999999553,
              827.6000000014901,
              20477.70000000298,
              826.2999999970198,
              42025.79999999702
            ],
            "endedAtMs": 105150.10000000149
          },
          {
            "attemptIndex": 2,
            "correct": 7,
            "wrong": 0,
            "total": 3,
            "completion": 1,
            "accuracy": 1,
            "finalScore": 7,
            "startedAtMs": 539.6999999955297,
            "outcome": "quit",
            "questionDurationsMs": [
              396.1000000014901,
              14407.69999999553,
              827.6000000014901,
              20477.70000000298,
              826.2999999970198,
              42025.79999999702
            ],
            "endedAtMs": 107639.29999999702
          }
        ],
        "items_total": 9,
        "items": [
          {
            "item_id": "select_01",
            "item_type": "select",
            "seq": 1,
            "run_seq": 1,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_SELECT_01",
            "scene_seq": 1,
            "scene_type": "select",
            "expected": {
              "item_id_override": "select_01",
              "question_type": "identify_one",
              "correct_option": "s1_item_suong_correct",
              "options": [
                {
                  "id": "s1_item_rainny"
                },
                {
                  "id": "s1_item_sunny"
                },
                {
                  "id": "s1_item_suong_correct"
                }
              ],
              "has_submit_button": false
            },
            "history": [
              {
                "attempt": 1,
                "presented_at_ms": 1773452205976,
                "selected_at_ms": 1773452206371,
                "time_response_ms": 395,
                "response": {
                  "selected_option": "s1_item_suong_correct",
                  "change_before_submit": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          },
          {
            "item_id": "Shape_02",
            "item_label": "Núi trái",
            "item_type": "paint-shape",
            "seq": 2,
            "run_seq": 1,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_PAINT_01",
            "scene_seq": 2,
            "scene_type": "paint",
            "expected": {
              "item_id_override": "Shape_02",
              "item_type_override": "paint-shape",
              "regions": [
                {
                  "id": "Shape_02",
                  "key": "s2_part_1_2",
                  "allowed_colors": [
                    "0xff595e",
                    "0xffca3a",
                    "0x8ac926",
                    "0x1982c4",
                    "0x6a4c93",
                    "0xfdfcdc",
                    "0x000000"
                  ],
                  "correct_color": null
                }
              ],
              "min_region_coverage": 0.9,
              "max_spill_ratio": 0
            },
            "history": [
              {
                "attempt": 1,
                "started_at_ms": 1773452224274,
                "ended_at_ms": 1773452227422,
                "time_spent_ms": 3148,
                "response": {},
                "is_correct": false,
                "error_code": "USER_ABANDONED",
                "hint_used": 1
              }
            ],
            "hint_used": 1
          },
          {
            "item_id": "select_01",
            "item_type": "select",
            "seq": 1,
            "run_seq": 2,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_SELECT_01",
            "scene_seq": 1,
            "scene_type": "select",
            "expected": {
              "item_id_override": "select_01",
              "question_type": "identify_one",
              "correct_option": "s1_item_suong_correct",
              "options": [
                {
                  "id": "s1_item_rainny"
                },
                {
                  "id": "s1_item_sunny"
                },
                {
                  "id": "s1_item_suong_correct"
                }
              ],
              "has_submit_button": false
            },
            "history": [
              {
                "attempt": 1,
                "presented_at_ms": 1773452227562,
                "selected_at_ms": 1773452228389,
                "time_response_ms": 827,
                "response": {
                  "selected_option": "s1_item_suong_correct",
                  "change_before_submit": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          },
          {
            "item_id": "Shape_02",
            "item_label": "Núi trái",
            "item_type": "paint-shape",
            "seq": 2,
            "run_seq": 2,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_PAINT_01",
            "scene_seq": 2,
            "scene_type": "paint",
            "expected": {
              "item_id_override": "Shape_02",
              "item_type_override": "paint-shape",
              "regions": [
                {
                  "id": "Shape_02",
                  "key": "s2_part_1_2",
                  "allowed_colors": [
                    "0xff595e",
                    "0xffca3a",
                    "0x8ac926",
                    "0x1982c4",
                    "0x6a4c93",
                    "0xfdfcdc",
                    "0x000000"
                  ],
                  "correct_color": null
                }
              ],
              "min_region_coverage": 0.9,
              "max_spill_ratio": 0
            },
            "history": [
              {
                "attempt": 1,
                "started_at_ms": 1773452247165,
                "ended_at_ms": 1773452255172,
                "time_spent_ms": 8007,
                "response": {},
                "is_correct": false,
                "error_code": "USER_ABANDONED",
                "hint_used": 1
              }
            ],
            "hint_used": 1
          },
          {
            "item_id": "Char_01",
            "item_label": "Chữ g",
            "item_type": "paint-char",
            "seq": 3,
            "run_seq": 2,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_PAINT_01",
            "scene_seq": 3,
            "scene_type": "paint",
            "expected": {
              "item_id_override": "Char_01",
              "item_type_override": "paint-char",
              "regions": [
                {
                  "id": "Char_01",
                  "key": "s2_part_2_1",
                  "allowed_colors": [
                    "0xff595e",
                    "0xffca3a",
                    "0x8ac926",
                    "0x1982c4",
                    "0x6a4c93",
                    "0xfdfcdc",
                    "0x000000"
                  ],
                  "correct_color": null
                }
              ],
              "min_region_coverage": 0.9,
              "max_spill_ratio": 0
            },
            "history": [
              {
                "attempt": 1,
                "started_at_ms": 1773452237327,
                "ended_at_ms": 1773452237328,
                "time_spent_ms": 1,
                "response": {
                  "selected_color": "0x000000",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Char_01",
                      "area_px": 17054,
                      "paint_in_px": 458,
                      "paint_out_px": 0,
                      "coverage": 0.040729212983548244,
                      "spill_ratio": 0,
                      "selected_color": "0x000000"
                    }
                  ],
                  "total_paint_in_px": 458,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.040729212983548244,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              },
              {
                "attempt": 2,
                "started_at_ms": 1773452253437,
                "ended_at_ms": 1773452253437,
                "time_spent_ms": 0,
                "response": {
                  "selected_color": "0x000000",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Char_01",
                      "area_px": 0,
                      "paint_in_px": 10510,
                      "paint_out_px": 0,
                      "coverage": 0.9346376167185415,
                      "spill_ratio": 0,
                      "selected_color": "0x000000"
                    }
                  ],
                  "total_paint_in_px": 10510,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.9346376167185415,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          },
          {
            "item_id": "select_01",
            "item_type": "select",
            "seq": 1,
            "run_seq": 3,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_SELECT_01",
            "scene_seq": 1,
            "scene_type": "select",
            "expected": {
              "item_id_override": "select_01",
              "question_type": "identify_one",
              "correct_option": "s1_item_suong_correct",
              "options": [
                {
                  "id": "s1_item_rainny"
                },
                {
                  "id": "s1_item_sunny"
                },
                {
                  "id": "s1_item_suong_correct"
                }
              ],
              "has_submit_button": false
            },
            "history": [
              {
                "attempt": 1,
                "presented_at_ms": 1773452255378,
                "selected_at_ms": 1773452256203,
                "time_response_ms": 825,
                "response": {
                  "selected_option": "s1_item_suong_correct",
                  "change_before_submit": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          },
          {
            "item_id": "Shape_01",
            "item_label": "Núi phải",
            "item_type": "paint-shape",
            "seq": 1,
            "run_seq": 3,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_PAINT_01",
            "scene_seq": 1,
            "scene_type": "paint",
            "expected": {
              "item_id_override": "Shape_01",
              "item_type_override": "paint-shape",
              "regions": [
                {
                  "id": "Shape_01",
                  "key": "s2_part_1_1",
                  "allowed_colors": [
                    "0xff595e",
                    "0xffca3a",
                    "0x8ac926",
                    "0x1982c4",
                    "0x6a4c93",
                    "0xfdfcdc",
                    "0x000000"
                  ],
                  "correct_color": null
                }
              ],
              "min_region_coverage": 0.9,
              "max_spill_ratio": 0
            },
            "history": [
              {
                "attempt": 1,
                "started_at_ms": 1773452298331,
                "ended_at_ms": 1773452298331,
                "time_spent_ms": 0,
                "response": {
                  "selected_color": "0x6a4c93",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Shape_01",
                      "area_px": 4969,
                      "paint_in_px": 2848,
                      "paint_out_px": 0,
                      "coverage": 1,
                      "spill_ratio": 0,
                      "selected_color": "0x6a4c93"
                    }
                  ],
                  "total_paint_in_px": 2848,
                  "total_paint_out_px": 0,
                  "completion_pct": 1,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          },
          {
            "item_id": "Shape_02",
            "item_label": "Núi trái",
            "item_type": "paint-shape",
            "seq": 2,
            "run_seq": 3,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_PAINT_01",
            "scene_seq": 2,
            "scene_type": "paint",
            "expected": {
              "item_id_override": "Shape_02",
              "item_type_override": "paint-shape",
              "regions": [
                {
                  "id": "Shape_02",
                  "key": "s2_part_1_2",
                  "allowed_colors": [
                    "0xff595e",
                    "0xffca3a",
                    "0x8ac926",
                    "0x1982c4",
                    "0x6a4c93",
                    "0xfdfcdc",
                    "0x000000"
                  ],
                  "correct_color": null
                }
              ],
              "min_region_coverage": 0.9,
              "max_spill_ratio": 0
            },
            "history": [
              {
                "attempt": 1,
                "started_at_ms": 1773452304761,
                "ended_at_ms": 1773452304761,
                "time_spent_ms": 0,
                "response": {
                  "selected_color": "0x6a4c93",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Shape_02",
                      "area_px": 12183,
                      "paint_in_px": 6995,
                      "paint_out_px": 0,
                      "coverage": 1,
                      "spill_ratio": 0,
                      "selected_color": "0x6a4c93"
                    }
                  ],
                  "total_paint_in_px": 6995,
                  "total_paint_out_px": 0,
                  "completion_pct": 1,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          },
          {
            "item_id": "Char_01",
            "item_label": "Chữ g",
            "item_type": "paint-char",
            "seq": 3,
            "run_seq": 3,
            "skill_ids": [],
            "difficulty": 1,
            "scene_id": "SCN_PAINT_01",
            "scene_seq": 3,
            "scene_type": "paint",
            "expected": {
              "item_id_override": "Char_01",
              "item_type_override": "paint-char",
              "regions": [
                {
                  "id": "Char_01",
                  "key": "s2_part_2_1",
                  "allowed_colors": [
                    "0xff595e",
                    "0xffca3a",
                    "0x8ac926",
                    "0x1982c4",
                    "0x6a4c93",
                    "0xfdfcdc",
                    "0x000000"
                  ],
                  "correct_color": null
                }
              ],
              "min_region_coverage": 0.9,
              "max_spill_ratio": 0
            },
            "history": [
              {
                "attempt": 1,
                "started_at_ms": 1773452291859,
                "ended_at_ms": 1773452291859,
                "time_spent_ms": 0,
                "response": {
                  "selected_color": "0x6a4c93",
                  "brush_size": 100,
                  "color_change_count": 0,
                  "brush_change_count": 0,
                  "regions_result": [
                    {
                      "region_id": "Char_01",
                      "area_px": 17054,
                      "paint_in_px": 11202,
                      "paint_out_px": 0,
                      "coverage": 0.9961760782570032,
                      "spill_ratio": 0,
                      "selected_color": "0x6a4c93"
                    }
                  ],
                  "total_paint_in_px": 11202,
                  "total_paint_out_px": 0,
                  "completion_pct": 0.9961760782570032,
                  "spill_ratio": 0
                },
                "is_correct": true,
                "error_code": null,
                "hint_used": 0
              }
            ],
            "hint_used": 0
          }
        ],
        "items_summary_by_type": {
          "select": {
            "item_type": "select",
            "itemsCount": 3,
            "passCount": 3,
            "failCount": 0,
            "quitCount": 0,
            "attemptsTotal": 3,
            "attemptsAvg": 1,
            "hintTotal": 0,
            "hintAvg": 0,
            "timeTotalMs": 2047,
            "timeAvgMs": 682.3333333333334,
            "errors": {},
            "metrics": {
              "changeBeforeSubmitTotal": 0,
              "judgedCount": 3,
              "correctPick": 3,
              "timeResponseAvgMs": 682.3333333333334,
              "pickAccuracy": 1,
              "wrongRepeatCount": 0
            }
          },
          "paint-shape": {
            "item_type": "paint-shape",
            "itemsCount": 4,
            "passCount": 2,
            "failCount": 0,
            "quitCount": 2,
            "attemptsTotal": 4,
            "attemptsAvg": 1,
            "hintTotal": 2,
            "hintAvg": 0.5,
            "timeTotalMs": 11155,
            "timeAvgMs": 2788.75,
            "errors": {
              "USER_ABANDONED": 2
            },
            "metrics": {
              "colorChangeTotal": 0,
              "brushChangeTotal": 0,
              "paintInPxTotal": 9843,
              "paintOutPxTotal": 0,
              "areaTotal": 17152,
              "colorsUsed": [
                "0x6a4c93"
              ],
              "spillAvg": 0,
              "completionAvg": 0.5
            }
          },
          "paint-char": {
            "item_type": "paint-char",
            "itemsCount": 2,
            "passCount": 2,
            "failCount": 0,
            "quitCount": 0,
            "attemptsTotal": 3,
            "attemptsAvg": 1.5,
            "hintTotal": 0,
            "hintAvg": 0,
            "timeTotalMs": 1,
            "timeAvgMs": 0.5,
            "errors": {},
            "metrics": {
              "colorChangeTotal": 0,
              "brushChangeTotal": 0,
              "paintInPxTotal": 22170,
              "paintOutPxTotal": 0,
              "areaTotal": 34108,
              "colorsUsed": [
                "0x000000",
                "0x6a4c93"
              ],
              "spillAvg": 0,
              "completionAvg": 0.9857714539795465
            }
          }
        },
        "items_errors_histogram": {
          "USER_ABANDONED": 2
        }
      }
    }
  }
}