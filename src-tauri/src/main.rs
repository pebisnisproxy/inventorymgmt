// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: Apache-2.0

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();
}
