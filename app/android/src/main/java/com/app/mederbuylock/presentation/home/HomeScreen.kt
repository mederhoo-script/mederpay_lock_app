package com.app.mederbuylock.presentation.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.app.mederbuylock.domain.model.PaymentStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToLock: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.navEvents.collect { event ->
            when (event) {
                HomeNavEvent.ToLockScreen -> onNavigateToLock()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "MederPay",
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF4FC3F7),
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF12122A),
                ),
                actions = {
                    IconButton(onClick = viewModel::refresh) {
                        Icon(
                            Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = Color(0xFF4FC3F7),
                        )
                    }
                },
            )
        },
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF0D0D1A))
                .padding(padding),
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = Color(0xFF4FC3F7),
                )
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    uiState.deviceInfo?.let { device ->
                        // User greeting card
                        InfoCard(containerColor = Color(0xFF1E1E3A)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.Person,
                                    contentDescription = null,
                                    tint = Color(0xFF4FC3F7),
                                    modifier = Modifier.size(40.dp),
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        "Welcome back,",
                                        color = Color(0xFF78909C),
                                        fontSize = 13.sp,
                                    )
                                    Text(
                                        device.userName,
                                        color = Color.White,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold,
                                    )
                                }
                            }
                        }

                        // Payment status
                        PaymentStatusCard(uiState.paymentStatus, device.daysOverdue)

                        // Due date
                        LabeledIconCard(
                            icon = Icons.Default.DateRange,
                            label = "Payment Due Date",
                            value = device.paymentDueDate,
                        )

                        // Device details
                        InfoCard(containerColor = Color(0xFF1E1E3A)) {
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    "Device Details",
                                    color = Color(0xFF4FC3F7),
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 15.sp,
                                )
                                DetailRow("Phone Number", device.phoneNumber)
                                DetailRow(
                                    "Device ID",
                                    if (device.androidId.length > 12)
                                        device.androidId.take(12) + "…"
                                    else device.androidId,
                                )
                            }
                        }

                        // Payment account card (shown when a virtual account is available)
                        if (!device.accountNumber.isNullOrBlank() || device.balance > 0 || !device.paymentUrl.isNullOrBlank()) {
                            InfoCard(containerColor = Color(0xFF1B2A1B)) {
                                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text(
                                        "Payment Info",
                                        color = Color(0xFF81C784),
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 15.sp,
                                    )
                                    if (!device.accountNumber.isNullOrBlank()) {
                                        DetailRow("Account Number", device.accountNumber)
                                    }
                                    if (device.balance > 0) {
                                        val balanceFormatted = "₦${"%,.0f".format(device.balance / 100.0)}"
                                        DetailRow("Outstanding Balance", balanceFormatted)
                                    }
                                    if (!device.paymentUrl.isNullOrBlank()) {
                                        DetailRow("Pay via", device.paymentUrl)
                                    }
                                }
                            }
                        }
                    }

                    uiState.error?.let { err ->
                        InfoCard(containerColor = Color(0xFF7F1D1D)) {
                            Text(err, color = Color(0xFFFFCDD2), fontSize = 14.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PaymentStatusCard(status: PaymentStatus?, daysOverdue: Int) {
    val (label, labelColor, bg) = when (status) {
        is PaymentStatus.Active -> Triple("✓ Payment Active", Color(0xFF81C784), Color(0xFF1B3A1B))
        is PaymentStatus.Locked -> Triple("🔒 Device Locked", Color(0xFFEF5350), Color(0xFF4A0E0E))
        is PaymentStatus.Overdue -> Triple("⚠️ $daysOverdue days overdue", Color(0xFFFFB74D), Color(0xFF4A2A00))
        is PaymentStatus.GracePeriod -> Triple("⏳ Grace Period", Color(0xFFFFF176), Color(0xFF3A3000))
        null -> Triple("Checking…", Color(0xFF78909C), Color(0xFF1E1E3A))
    }
    InfoCard(containerColor = bg) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Info, contentDescription = null, tint = labelColor)
            Spacer(modifier = Modifier.width(10.dp))
            Text(label, color = labelColor, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

@Composable
private fun LabeledIconCard(icon: ImageVector, label: String, value: String) {
    InfoCard(containerColor = Color(0xFF1E1E3A)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = Color(0xFF4FC3F7))
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(label, color = Color(0xFF78909C), fontSize = 12.sp)
                Spacer(modifier = Modifier.height(2.dp))
                Text(value, color = Color.White, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun InfoCard(containerColor: Color, content: @Composable () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
    ) {
        Box(modifier = Modifier.padding(16.dp)) { content() }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, color = Color(0xFF78909C), fontSize = 13.sp)
        Text(value, color = Color.White, fontSize = 13.sp)
    }
}
